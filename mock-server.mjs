// Mock WebSocket server for testing kestrel-talk frontend
// Simulates kestrel-agent v2 block-level streaming protocol
//
// Usage: node mock-server.mjs

import { WebSocketServer } from 'ws';

const PORT = 8090;
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const wss = new WebSocketServer({ port: PORT });

console.log(`Mock kestrel-agent WebSocket server on ws://127.0.0.1:${PORT}`);
if (AUTH_TOKEN) console.log(`Auth required, token: ${AUTH_TOKEN}`);

const responses = [
  {
    blocks: [
      { type: 'text', content: "Hello! I'm kestrel-agent. How can I help you today?" },
    ],
  },
  {
    blocks: [
      { type: 'thinking', content: 'User wants a Rust example. Let me write clean code.' },
      { type: 'text', content: "Here's a Rust hello world:" },
      { type: 'code', language: 'rust', content: 'fn main() {\n    println!("Hello, world!");\n}\n' },
      { type: 'text', content: 'Run with `cargo run`.' },
    ],
  },
  {
    blocks: [
      { type: 'thinking', content: 'Python example with error handling needed...' },
      { type: 'text', content: 'Python with error handling:' },
      { type: 'code', language: 'python', content: 'def greet(name: str) -> str:\n    """Generate a greeting."""\n    if not name:\n        raise ValueError("Name cannot be empty")\n    return f"Hello, {name}!"\n\n\nif __name__ == "__main__":\n    try:\n        print(greet("kestrel"))\n    except ValueError as e:\n        print(f"Error: {e}")' },
      { type: 'text', content: 'Uses type hints and proper __error__ handling.' },
    ],
  },
  {
    blocks: [
      { type: 'text', content: "I'll search for that:" },
      { type: 'tool_call', content: '{"tool": "web_search", "query": "kestrel rust agent"}' },
      { type: 'tool_result', content: '{"results": [{"title": "kestrel-agent", "url": "https://github.com/Bahtya/kestrel-agent", "snippet": "Fast streaming AI agent framework in Rust"}]}' },
      { type: 'text', content: 'Found [kestrel-agent](https://github.com/Bahtya/kestrel-agent) — a fast streaming AI agent framework in Rust.' },
    ],
  },
  {
    blocks: [
      { type: 'text', content: 'Here\'s an image:' },
      { type: 'text', content: '![Kestrel](https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kestrel_%28Falco_tinnunculus%29_%2822662690822%29.jpg/320px-Kestrel_%28Falco_tinnunculus%29_%2822662690822%29.jpg)' },
      { type: 'text', content: 'A common kestrel (*Falco tinnunculus*).' },
    ],
  },
  // error block test
  {
    blocks: [
      { type: 'text', content: 'Let me try that operation...' },
    ],
    error: { code: 'rate_limit', message: 'Too many requests. Please wait and try again.' },
  },
  // v1 simple streaming test
  {
    v1: true,
    content: "This is a v1 simple streaming response. It uses the old streaming format with chunk and done fields. Markdown works too: **bold**, _italic_, `code`.",
  },
  // Interleaved blocks: text starts, code appears before text ends, then both finish
  {
    interleaved: true,
    blocks: [
      { id: 'b1', type: 'text', chunks: ['Analyzing your request...', '\n\nBased on my analysis:'] },
      { id: 'b2', type: 'code', language: 'typescript', chunks: ['const result = ', 'analyze(input);', '\nconsole.log(result);'] },
      { id: 'b3', type: 'text', chunks: ['This demonstrates ', 'interleaved block streaming.'] },
    ],
  },
  // Image block via protocol
  {
    image: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kestrel_%28Falco_tinnunculus%29_%2822662690822%29.jpg/320px-Kestrel_%28Falco_tinnunculus%29_%2822662690822%29.jpg', caption: 'A common kestrel' },
  },
  // Auth error
  {
    blocks: [
      { type: 'text', content: 'Checking permissions...' },
    ],
    error: { code: 'auth_required', message: 'You need to authenticate to perform this action.' },
  },
  // Timeout error
  {
    blocks: [
      { type: 'text', content: 'Processing your request...' },
    ],
    error: { code: 'timeout', message: 'The request timed out. Please try again.' },
  },
];

wss.on('connection', (ws, req) => {
  const clientId = crypto.randomUUID();
  let authenticated = !AUTH_TOKEN;
  let responseIndex = 0;

  console.log(`Client connected: ${clientId}`);

  // Check query token
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const queryToken = url.searchParams.get('token');
  if (AUTH_TOKEN && queryToken === AUTH_TOKEN) {
    authenticated = true;
  }

  function sendWelcome() {
    send({ type: 'welcome', id: uuid(), client_id: clientId, server_version: '0.2.0-mock' });
  }

  function handleMessage(data) {
    const raw = data.toString();
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'ping') {
      send({ type: 'pong', id: uuid() });
      return;
    }

    if (msg.type === 'message') {
      console.log(`[${clientId}] User: ${msg.content}`);
      handleUserMessage(msg);
    }
  }

  async function handleUserMessage(msg) {
    const response = responses[responseIndex % responses.length];
    responseIndex++;

    send({ type: 'typing' });
    await delay(200);

    // v1 simple streaming mode
    if (response.v1) {
      const content = response.content;
      const chunkSize = 12;
      const id = uuid();

      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        send({ type: 'streaming', id, chunk, done: false });
        await delay(15);
      }
      send({ type: 'streaming', id, chunk: '', done: true });
      return;
    }

    // Image protocol message
    if (response.image) {
      await delay(300);
      send({ type: 'image', id: uuid(), url: response.image.url, caption: response.image.caption });
      return;
    }

    // Interleaved block streaming
    if (response.interleaved) {
      const responseId = uuid();
      send({ type: 'response_start', id: responseId, reply_to: msg.id });

      // Start all blocks
      for (const block of response.blocks) {
        send({ type: 'block_start', id: block.id, response_id: responseId, block_type: block.type, language: block.language ?? null });
      }

      // Stream chunks round-robin across all blocks
      const remaining = response.blocks.map((b) => [...b.chunks]);
      while (remaining.some((r) => r.length > 0)) {
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].length > 0) {
            const chunk = remaining[i].shift();
            send({ type: 'block_delta', id: response.blocks[i].id, response_id: responseId, content: chunk });
            await delay(15);
          }
        }
      }

      // End all blocks
      for (const block of response.blocks) {
        send({ type: 'block_end', id: block.id, response_id: responseId });
      }

      send({ type: 'response_end', id: responseId });
      return;
    }

    // v2 block-level streaming
    const responseId = uuid();

    send({ type: 'response_start', id: responseId, reply_to: msg.id });

    for (const block of response.blocks) {
      const blockId = uuid();

      send({
        type: 'block_start',
        id: blockId,
        response_id: responseId,
        block_type: block.type,
        language: block.language ?? null,
      });

      const content = block.content;
      const chunkSize = 8;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        send({
          type: 'block_delta',
          id: blockId,
          response_id: responseId,
          content: chunk,
        });
        await delay(10);
      }

      send({ type: 'block_end', id: blockId, response_id: responseId });
      await delay(50);
    }

    if (response.error) {
      send({ type: 'error', id: responseId, code: response.error.code, content: response.error.message });
      send({ type: 'response_end', id: responseId });
    } else {
      send({ type: 'response_end', id: responseId });
    }
  }

  function send(data) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    }
  }

  if (!authenticated) {
    const authHandler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'auth' && msg.token === AUTH_TOKEN) {
          authenticated = true;
          ws.removeListener('message', authHandler);
          sendWelcome();
          ws.on('message', handleMessage);
        } else {
          send({ type: 'error', id: uuid(), code: 'auth_required', content: 'Authentication failed' });
          ws.close();
        }
      } catch { /* ignore */ }
    };
    ws.on('message', authHandler);
    return;
  }

  sendWelcome();
  ws.on('message', handleMessage);

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
  });
});

function uuid() {
  return crypto.randomUUID();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
