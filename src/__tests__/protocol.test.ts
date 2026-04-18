import { describe, it, expect } from 'vitest';
import {
  parseEnvelope,
  createMessage,
  createPing,
  type ServerEnvelope,
} from '../lib/ws/protocol';

describe('parseEnvelope', () => {
  it('parses a valid message envelope', () => {
    const raw = '{"type":"message","id":"abc-123","content":"hello"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    expect(env!.type).toBe('message');
    if (env!.type === 'message') {
      expect(env!.content).toBe('hello');
      expect(env!.id).toBe('abc-123');
    }
  });

  it('parses a streaming envelope', () => {
    const raw = '{"type":"streaming","id":"s1","chunk":"hello ","done":false}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    expect(env!.type).toBe('streaming');
    if (env!.type === 'streaming') {
      expect(env!.chunk).toBe('hello ');
      expect(env!.done).toBe(false);
    }
  });

  it('parses a streaming done envelope', () => {
    const raw = '{"type":"streaming","id":"s1","chunk":"","done":true}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'streaming') {
      expect(env!.done).toBe(true);
    }
  });

  it('parses a welcome envelope', () => {
    const raw = '{"type":"welcome","id":"w1","client_id":"c-123","server_version":"0.2.0"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'welcome') {
      expect(env!.client_id).toBe('c-123');
      expect(env!.server_version).toBe('0.2.0');
    }
  });

  it('parses v2 block_start envelope', () => {
    const raw = '{"type":"block_start","id":"b1","response_id":"r1","block_type":"code","language":"rust"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'block_start') {
      expect(env!.block_type).toBe('code');
      expect(env!.response_id).toBe('r1');
      expect(env!.language).toBe('rust');
    }
  });

  it('parses v2 block_delta envelope', () => {
    const raw = '{"type":"block_delta","id":"b1","response_id":"r1","content":"fn main() {}"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'block_delta') {
      expect(env!.content).toBe('fn main() {}');
    }
  });

  it('parses error envelope', () => {
    const raw = '{"type":"error","id":"e1","code":"auth_required","content":"Auth failed"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'error') {
      expect(env!.code).toBe('auth_required');
      expect(env!.content).toBe('Auth failed');
    }
  });

  it('parses image envelope', () => {
    const raw = '{"type":"image","id":"i1","url":"https://example.com/img.png","caption":"test"}';
    const env = parseEnvelope(raw);
    expect(env).not.toBeNull();
    if (env!.type === 'image') {
      expect(env!.url).toBe('https://example.com/img.png');
      expect(env!.caption).toBe('test');
    }
  });

  it('returns null for invalid JSON', () => {
    expect(parseEnvelope('not json')).toBeNull();
  });

  it('returns null for object without type', () => {
    expect(parseEnvelope('{"content":"hello"}')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseEnvelope('')).toBeNull();
  });
});

describe('createMessage', () => {
  it('creates a message envelope with content', () => {
    const env = createMessage('hello');
    expect(env.type).toBe('message');
    expect(env.content).toBe('hello');
    expect(env.id).toBeTruthy();
  });
});

describe('createPing', () => {
  it('creates a ping envelope', () => {
    const env = createPing();
    expect(env.type).toBe('ping');
  });
});
