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
  // v1 simple streaming test
  {
    v1: true,
    content: "This is a v1 simple streaming response. It uses the old streaming format with chunk and done fields. Markdown works too: **bold**, _italic_, `code`.",
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

    send({ type: 'response_end', id: responseId });
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
