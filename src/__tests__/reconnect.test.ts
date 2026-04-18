import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReconnectStrategy } from '../lib/ws/reconnect';

describe('ReconnectStrategy', () => {
  let strategy: ReconnectStrategy;

  beforeEach(() => {
    vi.useFakeTimers();
    strategy = new ReconnectStrategy();
  });

  afterEach(() => {
    strategy.cancel();
    vi.useRealTimers();
  });

  it('starts with 1s delay', () => {
    expect(strategy.currentDelay).toBe(1000);
  });

  it('doubles delay on each attempt', () => {
    const callback = vi.fn();
    strategy.schedule(callback);
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(strategy.currentDelay).toBe(2000);
  });

  it('caps delay at 30s', () => {
    for (let i = 0; i < 10; i++) {
      strategy.schedule(() => {});
      vi.advanceTimersByTime(strategy.currentDelay);
    }
    expect(strategy.currentDelay).toBe(30000);
  });

  it('resets delay on reset()', () => {
    strategy.schedule(() => {});
    vi.advanceTimersByTime(1000);
    strategy.reset();
    expect(strategy.currentDelay).toBe(1000);
  });

  it('cancels pending schedule', () => {
    const callback = vi.fn();
    strategy.schedule(callback);
    strategy.cancel();
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('replaces previous schedule on new schedule call', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    strategy.schedule(callback1);
    strategy.schedule(callback2);
    vi.advanceTimersByTime(2000);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
