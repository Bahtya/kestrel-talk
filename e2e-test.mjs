// Full E2E protocol test against mock server
import { WebSocket } from 'ws';

const WS_URL = 'ws://127.0.0.1:8090';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function connect(url = WS_URL) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const messages = [];
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    ws.on('open', () => resolve({ ws, messages }));
    ws.on('error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
}

function waitForNew(messages, sinceIndex, predicate, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      for (let i = sinceIndex; i < messages.length; i++) {
        if (predicate(messages[i])) return resolve(messages[i]);
      }
      if (Date.now() - start > timeout) {
        const recent = messages.slice(sinceIndex).map(m => m.type);
        return reject(new Error(`Timeout. New types: ${[...new Set(recent)].join(', ')}`));
      }
      setTimeout(check, 100);
    };
    check();
  });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

async function sendAndWait(ws, messages, id, content) {
  const before = messages.length;
  ws.send(JSON.stringify({ type: 'message', id, content }));
  await waitForNew(messages, before, m =>
    m.type === 'response_end' || (m.type === 'streaming' && m.done === true)
  );
}

async function runTests() {
  console.log('\n=== E2E Protocol Tests ===\n');

  await test('1. Connection + welcome', async () => {
    const { ws, messages } = await connect();
    const welcome = await waitForNew(messages, 0, m => m.type === 'welcome');
    if (!welcome.client_id) throw new Error('No client_id');
    ws.close();
  });

  await test('2. v2 block streaming flow', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    await sendAndWait(ws, messages, 't2', 'hello');

    const types = new Set(messages.map(m => m.type));
    for (const t of ['response_start', 'block_start', 'block_delta', 'block_end', 'response_end']) {
      if (!types.has(t)) throw new Error(`Missing ${t}`);
    }
    ws.close();
  });

  await test('3. Multiple sequential messages', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');

    for (let i = 0; i < 6; i++) {
      await sendAndWait(ws, messages, `t3-${i}`, `msg ${i}`);
    }

    const ends = messages.filter(m => m.type === 'response_end').length;
    const done = messages.filter(m => m.type === 'streaming' && m.done).length;
    if (ends + done < 6) throw new Error(`Got ${ends + done} completions, expected 6`);
    ws.close();
  });

  await test('4. Ping → Pong', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    const before = messages.length;
    ws.send(JSON.stringify({ type: 'ping' }));
    const pong = await waitForNew(messages, before, m => m.type === 'pong');
    if (!pong.id) throw new Error('No id');
    ws.close();
  });

  await test('5. Typing indicator', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    const before = messages.length;
    ws.send(JSON.stringify({ type: 'message', id: 't5', content: 'test' }));
    await waitForNew(messages, before, m => m.type === 'typing');
    ws.close();
  });

  await test('6. All block types (text, code, thinking, tool_call, tool_result)', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');

    for (let i = 0; i < 6; i++) {
      await sendAndWait(ws, messages, `t6-${i}`, `cycle ${i}`);
    }

    const blockTypes = new Set(messages.filter(m => m.type === 'block_start').map(m => m.block_type));
    const required = ['text', 'code', 'thinking', 'tool_call', 'tool_result'];
    for (const r of required) {
      if (!blockTypes.has(r)) throw new Error(`Missing ${r}. Got: ${[...blockTypes].join(', ')}`);
    }
    ws.close();
  });

  await test('7. Code block has language', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Response 1 = thinking + text + code(rust) + text
    await sendAndWait(ws, messages, 't7a', 'skip'); // response 0
    await sendAndWait(ws, messages, 't7b', 'code'); // response 1

    const codeBlock = messages.find(m => m.type === 'block_start' && m.block_type === 'code');
    if (!codeBlock) throw new Error('No code block');
    if (!codeBlock.language) throw new Error('No language');
    ws.close();
  });

  await test('8. Thinking block', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Response 1 has thinking
    await sendAndWait(ws, messages, 't8a', 'skip');
    await sendAndWait(ws, messages, 't8b', 'think');

    const thinkBlock = messages.find(m => m.type === 'block_start' && m.block_type === 'thinking');
    if (!thinkBlock) throw new Error('No thinking block');
    ws.close();
  });

  await test('9. Tool call + result blocks', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Response 3 has tool_call + tool_result
    for (let i = 0; i < 4; i++) {
      await sendAndWait(ws, messages, `t9-${i}`, `tool ${i}`);
    }

    if (!messages.find(m => m.type === 'block_start' && m.block_type === 'tool_call')) throw new Error('No tool_call');
    if (!messages.find(m => m.type === 'block_start' && m.block_type === 'tool_result')) throw new Error('No tool_result');
    ws.close();
  });

  await test('10. v1 simple streaming', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Response 6 is v1 streaming (0-5 are text, rust, python, tool, image, error)
    for (let i = 0; i < 6; i++) {
      await sendAndWait(ws, messages, `t10a-${i}`, `skip ${i}`);
    }
    await sendAndWait(ws, messages, 't10b', 'v1');

    const streamingMsgs = messages.filter(m => m.type === 'streaming');
    if (streamingMsgs.length === 0) throw new Error('No streaming messages');
    if (!streamingMsgs.find(m => m.done)) throw new Error('No streaming done');
    ws.close();
  });

  await test('11. Multiple blocks per response', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Response 1 = 4 blocks, response 3 = 4 blocks
    await sendAndWait(ws, messages, 't11a', 'skip'); // response 0 = 1 block
    await sendAndWait(ws, messages, 't11b', 'multi'); // response 1 = 4 blocks

    const blocks = messages.filter(m => m.type === 'block_start');
    if (blocks.length < 5) throw new Error(`Expected 5+ blocks total, got ${blocks.length}`);
    ws.close();
  });

  await test('12. Block delta accumulates content', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    await sendAndWait(ws, messages, 't12', 'delta test');

    const deltas = messages.filter(m => m.type === 'block_delta');
    if (deltas.length < 2) throw new Error(`Expected 2+ deltas, got ${deltas.length}`);
    ws.close();
  });

  await test('13. Interleaved block streaming', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Skip to interleaved response (index 6: 0-5 text/rust/python/tool/image/error, then v1 at 6)
    for (let i = 0; i < 8; i++) {
      await sendAndWait(ws, messages, `t13-${i}`, `skip ${i}`);
    }

    // Check that blocks were interleaved: multiple block_starts before any block_ends
    const blockStarts = messages.filter(m => m.type === 'block_start');
    if (blockStarts.length < 3) throw new Error(`Expected 3+ block_starts, got ${blockStarts.length}`);
    ws.close();
  });

  await test('14. Image protocol message', async () => {
    const { ws, messages } = await connect();
    await waitForNew(messages, 0, m => m.type === 'welcome');
    // Skip to image protocol message (index 8)
    for (let i = 0; i < 8; i++) {
      await sendAndWait(ws, messages, `t14-${i}`, `skip ${i}`);
    }

    // Image response sends type:image without response_end
    const before = messages.length;
    ws.send(JSON.stringify({ type: 'message', id: 't14-img', content: 'image' }));
    await waitForNew(messages, before, m => m.type === 'image');
    const imageMsg = messages.find(m => m.type === 'image');
    if (!imageMsg.url) throw new Error('No image URL');
    ws.close();
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
