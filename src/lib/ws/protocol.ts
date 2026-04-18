// kestrel-talk WebSocket protocol v2 (block-level streaming)
// with v1 compatibility (simple streaming)

// --- v2 Block-level protocol ---

export interface ResponseStartEnvelope {
  type: 'response_start';
  id: string;
  reply_to?: string;
}

export interface BlockStartEnvelope {
  type: 'block_start';
  id: string;
  response_id: string;
  block_type: 'text' | 'code' | 'thinking' | 'tool_call' | 'tool_result';
  language?: string | null;
}

export interface BlockDeltaEnvelope {
  type: 'block_delta';
  id: string;
  response_id: string;
  content: string;
}

export interface BlockEndEnvelope {
  type: 'block_end';
  id: string;
  response_id: string;
}

export interface ResponseEndEnvelope {
  type: 'response_end';
  id: string;
}

// --- v1 Simple streaming (compat) ---

export interface StreamingEnvelope {
  type: 'streaming';
  id: string;
  chunk: string;
  done: boolean;
}

// --- Common ---

export interface MessageEnvelope {
  type: 'message';
  id: string;
  content: string;
}

export interface WelcomeEnvelope {
  type: 'welcome';
  id: string;
  client_id: string;
  server_version: string;
}

export interface PongEnvelope {
  type: 'pong';
  id: string;
}

export interface ErrorEnvelope {
  type: 'error';
  id: string;
  code: string;
  content?: string;
}

export interface PingEnvelope {
  type: 'ping';
}

export interface AuthEnvelope {
  type: 'auth';
  token: string;
}

export interface TypingEnvelope {
  type: 'typing';
}

export interface ImageEnvelope {
  type: 'image';
  id: string;
  url: string;
  caption?: string;
}

export type ServerEnvelope =
  | WelcomeEnvelope
  | MessageEnvelope
  | StreamingEnvelope
  | ResponseStartEnvelope
  | BlockStartEnvelope
  | BlockDeltaEnvelope
  | BlockEndEnvelope
  | ResponseEndEnvelope
  | PongEnvelope
  | ErrorEnvelope
  | TypingEnvelope
  | ImageEnvelope;

export type ClientEnvelope =
  | MessageEnvelope
  | PingEnvelope
  | AuthEnvelope;

const VALID_BLOCK_TYPES = new Set(['text', 'code', 'thinking', 'tool_call', 'tool_result']);

function isValidEnvelope(parsed: Record<string, unknown>): boolean {
  const t = parsed.type as string;
  switch (t) {
    case 'welcome':
      return typeof parsed.id === 'string' && typeof parsed.client_id === 'string' && typeof parsed.server_version === 'string';
    case 'message':
    case 'pong':
      return typeof parsed.id === 'string';
    case 'error':
      return typeof parsed.id === 'string' && typeof parsed.code === 'string';
    case 'streaming':
      return typeof parsed.id === 'string' && typeof parsed.chunk === 'string' && typeof parsed.done === 'boolean';
    case 'response_start':
      return typeof parsed.id === 'string';
    case 'block_start':
      return typeof parsed.id === 'string' && typeof parsed.response_id === 'string' && VALID_BLOCK_TYPES.has(parsed.block_type as string);
    case 'block_delta':
      return typeof parsed.id === 'string' && typeof parsed.response_id === 'string' && typeof parsed.content === 'string';
    case 'block_end':
      return typeof parsed.id === 'string' && typeof parsed.response_id === 'string';
    case 'response_end':
      return typeof parsed.id === 'string';
    case 'image':
      return typeof parsed.id === 'string' && typeof parsed.url === 'string';
    case 'typing':
      return true;
    default:
      return false;
  }
}

export function parseEnvelope(raw: string): ServerEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.type !== 'string') return null;
    if (!isValidEnvelope(parsed)) return null;
    return parsed as ServerEnvelope;
  } catch {
    return null;
  }
}

export function createMessage(content: string): MessageEnvelope {
  return {
    type: 'message',
    id: crypto.randomUUID(),
    content,
  };
}

export function createPing(): PingEnvelope {
  return { type: 'ping' };
}
