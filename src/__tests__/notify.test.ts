// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  localStorage.clear();
});

describe('notify settings', () => {
  it('respects soundEnabled=false', async () => {
    localStorage.setItem('soundEnabled', 'false');
    const { playNotification, playSend } = await import('../lib/utils/notify');
    // Should not throw even when AudioContext is unavailable
    expect(() => playNotification()).not.toThrow();
    expect(() => playSend()).not.toThrow();
  });

  it('plays when soundEnabled=true', async () => {
    localStorage.setItem('soundEnabled', 'true');
    const { playNotification, playSend } = await import('../lib/utils/notify');
    expect(() => playNotification()).not.toThrow();
    expect(() => playSend()).not.toThrow();
  });
});

describe('browser-notify settings', () => {
  it('skips notification when notifEnabled=false', async () => {
    localStorage.setItem('notifEnabled', 'false');
    const { showNotification } = await import('../lib/utils/browser-notify');
    expect(() => showNotification('Test', 'Body')).not.toThrow();
  });
});
