# kestrel-talk

Web UI for [kestrel-agent](https://github.com/Bahtya/kestrel-agent) — a real-time streaming chat client with Telegram-like UX.

## Features

- **Block-level streaming** — text, code, thinking, tool calls render as independent blocks
- **Real-time code highlighting** — shiki syntax highlighting with streaming support
- **Telegram MarkdownV2** — underline, strikethrough, spoiler with fallback to standard markdown
- **HTML passthrough** — sanitized HTML rendering
- **Telegram UI** — dark theme, bubble tails, checkmarks, online status, date separators
- **Auto-reconnect** — exponential backoff with jitter, connection timeout, manual reconnect button
- **Message persistence** — localStorage with automatic save/load
- **Protocol validation** — strict envelope parsing rejects malformed data
- **Auth support** — token-based WebSocket authentication
- **Chat search** — Ctrl+F with match navigation and highlighting
- **Input history** — ↑/↓ arrow keys to recall previous messages
- **Slash commands** — `/clear`, `/help`, `/export`
- **Export chat** — download conversation as markdown
- **Mobile responsive** — collapsible sidebar with hamburger menu
- **Light/dark theme** — toggle with localStorage persistence
- **Toast notifications** — feedback for actions (clear, export, reconnect)
- **Notification sounds** — Web Audio API tones with toggle
- **Browser notifications** — desktop alerts with permission management
- **Code line numbers** — numbered gutter on code blocks
- **PWA** — installable with offline caching via service worker
- **Accessibility** — skip link, ARIA labels, keyboard navigation, reduced motion, focus management
- **Mock server** — test without kestrel-agent running

## Quick Start

```bash
npm install
node mock-server.mjs   # terminal 1 — mock kestrel-agent on :8090
npm run dev            # terminal 2 — dev server on :3000
```

Open `http://localhost:3000` and start chatting.

### Configuration

Copy `.env.example` to `.env` to customize defaults:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_WS_URL` | `ws://127.0.0.1:8090` | WebSocket endpoint |
| `VITE_AUTH_TOKEN` | _(empty)_ | Auth token (optional) |

Settings can also be changed at runtime via the gear icon in the sidebar.

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
| `error` | Error message with code |

### v1 Compatibility

Also supports simple streaming for backward compatibility:

```jsonc
{"type": "streaming", "id": "uuid", "chunk": "text", "done": false}
{"type": "streaming", "id": "uuid", "chunk": "", "done": true}
```

## Testing

```bash
# Unit tests (98 tests, 12 files)
npm test

# Browser E2E tests (26 tests — real Chromium)
npx playwright install chromium   # first time only
npx playwright test

# Protocol E2E tests (12 tests)
node e2e-test.mjs
```

### Browser E2E coverage

Real browser tests verifying: empty state, WebSocket connection, online status, message send/receive, streaming blocks, code highlighting, copy buttons, thinking blocks, tool calls, Ctrl+F search with highlight animation, export download, /clear command, input history, settings panel, mobile layout (375×812), scroll-to-bottom, date separators, checkmarks, /help and /export commands, reconnect indicator, toast notifications, mobile hamburger toggle, code line numbers, theme toggle.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build to dist/ |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npx playwright test` | Browser E2E tests |
| `node mock-server.mjs` | Mock WebSocket server on :8090 |
| `node e2e-test.mjs` | Protocol E2E tests |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `↑` / `↓` | Navigate input history |
| `Ctrl+F` | Search messages |
| `Ctrl+Shift+T` | Toggle theme |
| `Escape` | Close search/sidebar |
| `End` | Scroll to bottom |

## Tech Stack

- Svelte 5 + Vite + TypeScript
- shiki (syntax highlighting, lazy-loaded)
- marked (markdown parsing)
- DOMPurify (HTML sanitization)
- Playwright (browser E2E testing)

## Architecture

```
src/
├── lib/
│   ├── ws/          WebSocket connection, protocol, reconnection
│   ├── state/       Svelte 5 reactive store, type definitions
│   └── utils/       Markdown rendering, shiki, storage, scroll, time, notify, theme, export
├── components/
│   ├── layout/      Sidebar, ChatArea
│   ├── chat/        MessageList, MessageBubble, MessageInput, StreamingResponse, SearchBar, ConnectionSettings
│   ├── blocks/      TextBlock, CodeBlock, StreamingCodeBlock, ThinkingBlock, ToolBlock, ImageBlock
│   └── ToastContainer.svelte, ErrorBoundary.svelte
└── __tests__/       Unit tests (95 tests, 12 files)
```

## License

MIT
