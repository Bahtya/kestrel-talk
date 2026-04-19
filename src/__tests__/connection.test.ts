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
});
