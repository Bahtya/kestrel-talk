# kestrel-talk

Web UI for [kestrel-agent](https://github.com/Bahtya/kestrel-agent) — a real-time streaming chat client with Telegram-like UX.

## Features

- **Block-level streaming** — text, code, thinking, tool calls render as independent blocks
- **Real-time code highlighting** — shiki syntax highlighting with streaming support
- **Telegram MarkdownV2** — underline, strikethrough, spoiler with fallback to standard markdown
- **HTML passthrough** — sanitized HTML rendering
- **Telegram UI** — dark theme, bubble tails, checkmarks, online status, date separators
- **Auto-reconnect** — exponential backoff with message queue
- **Message persistence** — localStorage with automatic save/load
- **Auth support** — token-based WebSocket authentication
- **Chat search** — Ctrl+F with match navigation and highlighting
- **Input history** — ↑/↓ arrow keys to recall previous messages
- **Slash commands** — `/clear` to reset chat history
- **Export chat** — download conversation as markdown
- **Mobile responsive** — collapsible sidebar with overlay
- **Accessibility** — ARIA labels, keyboard navigation, reduced motion, focus management
- **Mock server** — test without kestrel-agent running

## Quick Start

```bash
# Install dependencies
npm install

# Start mock server (simulates kestrel-agent)
node mock-server.mjs

# Start dev server (in another terminal)
npm run dev
```

Open `http://localhost:3000` and start chatting.

## WebSocket Protocol (v2)

Block-level streaming protocol designed for real-time AI chat:

```jsonc
// Client sends message
{"type": "message", "id": "uuid", "content": "hello"}

// Server streams response in blocks
{"type": "response_start", "id": "r1", "reply_to": "user-msg-id"}
{"type": "block_start", "id": "b1", "response_id": "r1", "block_type": "text"}
{"type": "block_delta", "id": "b1", "response_id": "r1", "content": "chunk"}
{"type": "block_end", "id": "b1", "response_id": "r1"}
{"type": "response_end", "id": "r1"}
```

### Block types

| Type | Description |
|------|-------------|
| `text` | Markdown text (MarkdownV2 → Markdown → HTML) |
| `code` | Code block with language-based syntax highlighting |
| `thinking` | AI reasoning (collapsible, default hidden) |
| `tool_call` | Tool invocation request |
| `tool_result` | Tool execution output |
| `image` | Image with caption |

### v1 Compatibility

Also supports simple streaming for backward compatibility:

```jsonc
{"type": "streaming", "id": "uuid", "chunk": "text", "done": false}
{"type": "streaming", "id": "uuid", "chunk": "", "done": true}
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build to dist/ |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `node mock-server.mjs` | Start mock WebSocket server on :8090 |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `↑` / `↓` | Navigate input history |
| `Ctrl+F` | Search messages |
| `Escape` | Close search/sidebar |
| `End` | Scroll to bottom |

## Tech Stack

- Svelte 5 + Vite + TypeScript
- shiki (syntax highlighting, lazy-loaded)
- marked (markdown parsing)
- DOMPurify (HTML sanitization)

## Architecture

```
src/
├── lib/
│   ├── ws/          WebSocket connection, protocol, reconnection
│   ├── state/       Svelte 5 reactive store, type definitions
│   └── utils/       Markdown rendering, shiki highlighter, storage, scroll, time
├── components/
│   ├── layout/      Sidebar, ChatArea
│   ├── chat/        MessageList, MessageBubble, MessageInput, StreamingResponse
│   └── blocks/      TextBlock, CodeBlock, StreamingCodeBlock, ThinkingBlock, ToolBlock, ImageBlock
└── __tests__/       Unit tests (66 tests, 8 files)
```

## Testing

```bash
npm test            # 66 tests across 8 files
# protocol, reconnect, html-sanitizer, markdown-v2, storage,
# markdown rendering, scroll utils, time utils
```
