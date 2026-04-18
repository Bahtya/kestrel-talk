// Mock WebSocket server for testing kestrel-talk frontend
// Simulates kestrel-agent v2 block-level streaming protocol
//
// Usage: node mock-server.mjs

import { WebSocketServer } from 'ws';

const PORT = 8090;
const wss = new WebSocketServer({ port: PORT });

console.log(`Mock kestrel-agent WebSocket server on ws://127.0.0.1:${PORT}`);

const responses = [
  {
    blocks: [
      { type: 'text', content: 'Hello! I am kestrel-agent. How can I help you today?' },
    ],
  },
  {
    blocks: [
      { type: 'text', content: "Here's a Rust hello world example:" },
      { type: 'code', language: 'rust', content: 'fn main() {\n    println!("Hello, world!");\n}' },
      { type: 'text', content: 'Run it with `cargo run` and you\'ll see the output.' },
    ],
  },
  {
    blocks: [
      { type: 'thinking', content: 'The user is asking about Python. Let me think about the best approach...\n\nI should provide a clear example with proper error handling.' },
      { type: 'text', content: 'Here is a Python example with error handling:' },
      { type: 'code', language: 'python', content: 'def greet(name: str) -> str:\n    """Generate a greeting message."""\n    if not name:\n        raise ValueError("Name cannot be empty")\n    return f"Hello, {name}!"\n\n\nif __name__ == "__main__":\n    try:\n        message = greet("kestrel")\n        print(message)\n    except ValueError as e:\n        print(f"Error: {e}")' },
      { type: 'text', content: 'This uses type hints and proper __error__ handling with a try/except block.' },
    ],
  },
];

let responseIndex = 0;

wss.on('connection', (ws) => {
  const clientId = crypto.randomUUID();
  console.log(`Client connected: ${clientId}`);

  // Send welcome
  send(ws, { type: 'welcome', id: uuid(), client_id: clientId, server_version: '0.2.0-mock' });

  ws.on('message', (data) => {
    const raw = data.toString();
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong', id: uuid() });
      return;
    }

    if (msg.type === 'message') {
      console.log(`User: ${msg.content}`);
      handleUserMessage(ws, msg);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
  });
});

async function handleUserMessage(ws, msg) {
  const response = responses[responseIndex % responses.length];
  responseIndex++;

  const responseId = uuid();
  const replyTo = msg.id;

  // Send typing
  send(ws, { type: 'typing' });

  // Small delay before starting
  await delay(300);

  // Response start
  send(ws, { type: 'response_start', id: responseId, reply_to: replyTo });

  for (const block of response.blocks) {
    const blockId = uuid();

    // Block start
    send(ws, {
      type: 'block_start',
      id: blockId,
      response_id: responseId,
      block_type: block.type,
      language: block.language ?? null,
    });

    // Stream content in chunks
    const content = block.content;
    const chunkSize = 8;
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      send(ws, {
        type: 'block_delta',
        id: blockId,
        response_id: responseId,
        content: chunk,
      });
      await delay(30);
    }

    // Block end
    send(ws, { type: 'block_end', id: blockId, response_id: responseId });

    await delay(100);
  }

  // Response end
  send(ws, { type: 'response_end', id: responseId });
}

function send(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function uuid() {
  return crypto.randomUUID();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
