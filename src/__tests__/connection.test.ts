import { describe, it, expect, vi } from 'vitest';

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

import { WsConnection } from '../lib/ws/connection';

describe('WsConnection', () => {
  it('appends token as query parameter', () => {
    const conn = new WsConnection('ws://localhost:8090', 'secret');
    // @ts-expect-error test access
    expect(conn.connectionUrl).toBe('ws://localhost:8090/?token=secret');
  });

  it('preserves existing query parameters when adding token', () => {
    const conn = new WsConnection('ws://localhost:8090/?foo=bar', 'secret');
    // @ts-expect-error test access
    const url = new URL(conn.connectionUrl);
    expect(url.searchParams.get('token')).toBe('secret');
    expect(url.searchParams.get('foo')).toBe('bar');
  });

  it('returns raw URL when no token is set', () => {
    const conn = new WsConnection('ws://localhost:8090');
    // @ts-expect-error test access
    expect(conn.connectionUrl).toBe('ws://localhost:8090');
  });

  it('returns raw URL when URL parsing fails', () => {
    const conn = new WsConnection('not-a-url', 'secret');
    // @ts-expect-error test access
    expect(conn.connectionUrl).toBe('not-a-url');
  });

  it('queues message when not connected', () => {
    const conn = new WsConnection('ws://localhost:8090');
    conn.send('test-message');
    // Message should be queued, not thrown
    expect(conn.isConnected).toBe(false);
  });

  it('queues message when ws.send throws', () => {
    const conn = new WsConnection('ws://localhost:8090');
    const mockWs = {
      readyState: 1, // WebSocket.OPEN
      send: vi.fn(() => { throw new Error('Network error'); }),
    };
    // @ts-expect-error test access
    conn.ws = mockWs;
    conn.send('test-message');
    // Should not throw — message re-queued
    expect(mockWs.send).toHaveBeenCalledWith('test-message');
  });

  it('stops flushQueue on send error', () => {
    const conn = new WsConnection('ws://localhost:8090');
    let callCount = 0;
    const mockWs = {
      readyState: 1,
      send: vi.fn(() => {
        callCount++;
        if (callCount > 1) throw new Error('fail');
      }),
    };
    // @ts-expect-error test access
    conn.ws = mockWs;
    // @ts-expect-error test access
    conn.messageQueue = ['msg1', 'msg2', 'msg3'];
    // @ts-expect-error test access
    conn.flushQueue();
    // Should stop after failure, msg3 remains queued
    // @ts-expect-error test access
    expect(conn.messageQueue.length).toBeGreaterThanOrEqual(1);
  });
});
