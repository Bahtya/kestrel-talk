import type { ChatMessage, Block } from '../state/types';

const STORAGE_KEY = 'kestrel-talk-messages';
const MAX_STORED_MESSAGES = 200;

interface SerializedBlock extends Omit<Block, 'status'> {
  status: string;
}

interface SerializedMessage {
  id: string;
  role: string;
  content: string;
  blocks: SerializedBlock[];
  timestamp: string;
}

function serializeMessage(msg: ChatMessage): SerializedMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    blocks: msg.blocks.map((b) => ({ ...b, status: b.status })),
    timestamp: msg.timestamp.toISOString(),
  };
}

function deserializeMessage(raw: SerializedMessage): ChatMessage {
  return {
    id: raw.id,
    role: raw.role as ChatMessage['role'],
    content: raw.content,
    blocks: raw.blocks.map((b) => ({
      ...b,
      blockType: b.blockType as Block['blockType'],
      status: b.status as Block['status'],
    })),
    timestamp: new Date(raw.timestamp),
  };
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_STORED_MESSAGES);
    const serialized = trimmed.map(serializeMessage);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SerializedMessage[] = JSON.parse(raw);
    return parsed.map(deserializeMessage);
  } catch {
    return [];
  }
}

export function clearMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveSetting(key: string, value: string): void {
  try {
    localStorage.setItem(`kestrel-talk-${key}`, value);
  } catch {
    // ignore
  }
}

export function loadSetting(key: string, defaultValue: string): string {
  try {
    return localStorage.getItem(`kestrel-talk-${key}`) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

// Toast notification system
interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

let nextToastId = 0;
const toastList: Toast[] = [];
const toastListeners: Set<(toasts: readonly Toast[]) => void> = new Set();

export function getToasts(): readonly Toast[] {
  return toastList;
}

export function subscribeToasts(cb: (toasts: readonly Toast[]) => void): () => void {
  toastListeners.add(cb);
  return () => { toastListeners.delete(cb); };
}

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = nextToastId++;
  toastList.push({ id, message, type });
  toastListeners.forEach((cb) => cb([...toastList]));
  setTimeout(() => {
    const idx = toastList.findIndex((t) => t.id === id);
    if (idx !== -1) toastList.splice(idx, 1);
    toastListeners.forEach((cb) => cb([...toastList]));
  }, 3000);
}
