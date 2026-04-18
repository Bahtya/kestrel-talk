import { describe, it, expect } from 'vitest';
import { relativeTime, formatTime, formatFullTime } from '../lib/utils/time';

describe('relativeTime', () => {
  it('returns "just now" for recent times', () => {
    const now = new Date();
    expect(relativeTime(new Date(now.getTime() - 5000))).toBe('just now');
  });

  it('returns seconds ago', () => {
    const now = new Date();
    expect(relativeTime(new Date(now.getTime() - 30000))).toBe('30s ago');
  });

  it('returns minutes ago', () => {
    const now = new Date();
    expect(relativeTime(new Date(now.getTime() - 120000))).toBe('2m ago');
  });

  it('returns hours ago', () => {
    const now = new Date();
    expect(relativeTime(new Date(now.getTime() - 7200000))).toBe('2h ago');
  });

  it('returns days ago', () => {
    const now = new Date();
    expect(relativeTime(new Date(now.getTime() - 172800000))).toBe('2d ago');
  });

  it('returns date for old messages', () => {
    const old = new Date(2025, 0, 15);
    const result = relativeTime(old);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatTime', () => {
  it('formats time as HH:MM', () => {
    const date = new Date(2025, 0, 1, 14, 30);
    const result = formatTime(date);
    expect(result).toMatch(/14:30|2:30/);
  });
});

describe('formatFullTime', () => {
  it('includes both time and relative', () => {
    const now = new Date();
    const result = formatFullTime(new Date(now.getTime() - 5000));
    expect(result).toContain('just now');
  });
});
