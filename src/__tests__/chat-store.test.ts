// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ServerEnvelope } from '../lib/ws/protocol';

vi.mock('../lib/utils/notify', () => ({
  playNotification: vi.fn(),
  playSend: vi.fn(),
}));

vi.mock('../lib/utils/browser-notify', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../lib/utils/storage', () => ({
  saveMessages: vi.fn(),
  loadMessages: () => [],
  showToast: vi.fn(),
  getToasts: () => [],
  subscribeToToasts: () => () => {},
}));

vi.mock('../lib/ws/connection', () => {
  return {
    WsConnection: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
      this.onStateChange = vi.fn();
      this.onEnvelope = vi.fn();
      this.connect = vi.fn();
      this.disconnect = vi.fn();
      this.send = vi.fn();
    }),
  };
});

import { ChatStore } from '../lib/state/chat-store.svelte';

describe('ChatStore', () => {
  let store: InstanceType<typeof ChatStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store = new ChatStore();
  });

  it('starts with empty messages', () => {
    expect(store.messages).toEqual([]);
    expect(store.connectionState).toBe('disconnected');
  });

  it('clears history', () => {
    store.addSystemMessage('test');
    expect(store.messages.length).toBe(1);
    store.clearHistory();
    expect(store.messages).toEqual([]);
    expect(store.activeResponse).toBeNull();
  });

  it('adds system message', () => {
    store.addSystemMessage('Hello system');
    expect(store.messages.length).toBe(1);
    expect(store.messages[0].role).toBe('assistant');
    expect(store.messages[0].content).toBe('Hello system');
    expect(store.messages[0].blocks[0].blockType).toBe('text');
  });

  it('handles welcome envelope', () => {
    const env: ServerEnvelope = {
      type: 'welcome',
      id: 'w1',
      client_id: 'client-123',
      server_version: '0.2.0',
    };
    // Access private method via handleEnvelope
    // @ts-expect-error test access
    store.handleEnvelope(env);
    expect(store.clientId).toBe('client-123');
    expect(store.serverVersion).toBe('0.2.0');
  });

  it('handles typing envelope', () => {
    expect(store.isTyping).toBe(false);
    // @ts-expect-error test access
    store.handleEnvelope({ type: 'typing' });
    expect(store.isTyping).toBe(true);
  });

  it('handles complete message envelope', () => {
    const env: ServerEnvelope = {
      type: 'message',
      id: 'm1',
      content: 'Hello from agent',
    };
    // @ts-expect-error test access
    store.handleEnvelope(env);
    expect(store.messages.length).toBe(1);
    expect(store.messages[0].id).toBe('m1');
    expect(store.messages[0].content).toBe('Hello from agent');
    expect(store.messages[0].role).toBe('assistant');
  });

  it('handles error envelope', () => {
    const env: ServerEnvelope = {
      type: 'error',
      id: 'e1',
      code: 'rate_limit',
      content: 'Too many requests',
    };
    // @ts-expect-error test access
    store.handleEnvelope(env);
    expect(store.lastError).toBe('rate_limit: Too many requests');
    expect(store.messages.length).toBe(1);
    expect(store.messages[0].blocks[0].blockType).toBe('error');
  });

  it('handles image envelope', () => {
    const env: ServerEnvelope = {
      type: 'image',
      id: 'img1',
      url: 'https://example.com/test.png',
      caption: 'Test image',
    };
    // @ts-expect-error test access
    store.handleEnvelope(env);
    expect(store.messages.length).toBe(1);
    expect(store.messages[0].blocks[0].blockType).toBe('image');
    expect(store.messages[0].blocks[0].imageUrl).toBe('https://example.com/test.png');
  });

  describe('v2 block-level streaming', () => {
    it('handles full v2 streaming lifecycle', () => {
      // response_start
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_start', id: 'r1', reply_to: 'u1' });
      expect(store.activeResponse).not.toBeNull();
      expect(store.activeResponse!.id).toBe('r1');

      // block_start
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_start', id: 'b1', response_id: 'r1', block_type: 'text', language: null });
      expect(store.activeResponse!.blockOrder).toEqual(['b1']);

      // block_delta
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_delta', id: 'b1', response_id: 'r1', content: 'Hello ' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_delta', id: 'b1', response_id: 'r1', content: 'world' });
      const block = store.activeResponse!.blocks.get('b1');
      expect(block!.content).toBe('Hello world');

      // block_end
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_end', id: 'b1', response_id: 'r1' });
      expect(store.activeResponse!.blocks.get('b1')!.status).toBe('done');

      // response_end
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_end', id: 'r1' });
      expect(store.activeResponse).toBeNull();
      expect(store.messages.length).toBe(1);
      expect(store.messages[0].content).toBe('Hello world');
    });

    it('handles multiple blocks in one response', () => {
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_start', id: 'r2', reply_to: 'u2' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_start', id: 'b1', response_id: 'r2', block_type: 'text', language: null });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_delta', id: 'b1', response_id: 'r2', content: 'Here is code:' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_end', id: 'b1', response_id: 'r2' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_start', id: 'b2', response_id: 'r2', block_type: 'code', language: 'rust' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_delta', id: 'b2', response_id: 'r2', content: 'fn main() {}' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_end', id: 'b2', response_id: 'r2' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_end', id: 'r2' });

      expect(store.messages[0].blocks.length).toBe(2);
      expect(store.messages[0].blocks[0].blockType).toBe('text');
      expect(store.messages[0].blocks[1].blockType).toBe('code');
      expect(store.messages[0].blocks[1].language).toBe('rust');
    });

    it('ignores blocks with wrong response_id', () => {
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_start', id: 'r1', reply_to: '' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'block_start', id: 'b1', response_id: 'wrong-id', block_type: 'text', language: null });
      expect(store.activeResponse!.blockOrder).toEqual([]);
    });

    it('clears activeResponse on error with matching id', () => {
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_start', id: 'r1', reply_to: '' });
      expect(store.activeResponse).not.toBeNull();

      // @ts-expect-error test access
      store.handleEnvelope({ type: 'error', id: 'r1', code: 'timeout', content: 'Timed out' });
      expect(store.activeResponse).toBeNull();
      expect(store.messages[0].blocks[0].blockType).toBe('error');
    });
  });

  describe('v1 streaming compatibility', () => {
    it('handles v1 streaming chunks', () => {
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'streaming', id: 'v1-1', chunk: 'Hello ', done: false });
      expect(store.activeResponse).not.toBeNull();

      // @ts-expect-error test access
      store.handleEnvelope({ type: 'streaming', id: 'v1-1', chunk: 'world', done: false });
      const block = store.activeResponse!.blocks.values().next().value!;
      expect(block.content).toBe('Hello world');

      // @ts-expect-error test access
      store.handleEnvelope({ type: 'streaming', id: 'v1-1', chunk: '', done: true });
      expect(store.activeResponse).toBeNull();
      expect(store.messages[0].content).toBe('Hello world');
    });

    it('ignores v1 streaming if activeResponse exists', () => {
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'response_start', id: 'r1', reply_to: '' });
      // @ts-expect-error test access
      store.handleEnvelope({ type: 'streaming', id: 'v1-1', chunk: 'test', done: false });
      // v1 should be ignored since activeResponse already exists
      expect(store.activeResponse!.blockOrder).toEqual([]);
    });
  });
});
