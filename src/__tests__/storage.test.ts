// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { saveMessages, loadMessages, clearMessages, saveSetting, loadSetting } from '../lib/utils/storage';
import type { ChatMessage } from '../lib/state/types';

beforeEach(() => {
  localStorage.clear();
});

describe('message persistence', () => {
  const sampleMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      blocks: [],
      timestamp: new Date('2026-01-15T10:00:00Z'),
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Hi there!',
      blocks: [{
        id: 'b1',
        responseId: 'msg-2',
        blockType: 'text',
        language: null,
        content: 'Hi there!',
        status: 'done',
      }],
      timestamp: new Date('2026-01-15T10:00:05Z'),
    },
  ];

  it('saves and loads messages round-trip', () => {
    saveMessages(sampleMessages);
    const loaded = loadMessages();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('msg-1');
    expect(loaded[0].role).toBe('user');
    expect(loaded[1].blocks[0].content).toBe('Hi there!');
  });

  it('preserves Date objects', () => {
    saveMessages(sampleMessages);
    const loaded = loadMessages();
    expect(loaded[0].timestamp instanceof Date).toBe(true);
    expect(loaded[0].timestamp.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('returns empty array when no data', () => {
    expect(loadMessages()).toEqual([]);
  });

  it('clears messages', () => {
    saveMessages(sampleMessages);
    clearMessages();
    expect(loadMessages()).toEqual([]);
  });

  it('trims to max 200 messages', () => {
    const many: ChatMessage[] = Array.from({ length: 250 }, (_, i) => ({
      id: `msg-${i}`,
      role: 'user' as const,
      content: `Message ${i}`,
      blocks: [],
      timestamp: new Date(),
    }));
    saveMessages(many);
    const loaded = loadMessages();
    expect(loaded).toHaveLength(200);
    expect(loaded[0].id).toBe('msg-50');
    expect(loaded[199].id).toBe('msg-249');
  });
});

describe('settings persistence', () => {
  it('saves and loads a setting', () => {
    saveSetting('wsUrl', 'ws://example.com:8080');
    expect(loadSetting('wsUrl', 'default')).toBe('ws://example.com:8080');
  });

  it('returns default when not set', () => {
    expect(loadSetting('nonexistent', 'fallback')).toBe('fallback');
  });
});
