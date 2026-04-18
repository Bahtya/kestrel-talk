// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { getTheme, setTheme, toggleTheme } from '../lib/utils/theme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('defaults to system preference', () => {
    expect(getTheme()).toBe('dark'); // jsdom defaults to dark
  });

  it('sets theme and persists', () => {
    setTheme('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('toggles from dark to light', () => {
    setTheme('dark');
    expect(toggleTheme()).toBe('light');
    expect(getTheme()).toBe('light');
  });

  it('toggles from light to dark', () => {
    setTheme('light');
    expect(toggleTheme()).toBe('dark');
    expect(getTheme()).toBe('dark');
  });
});
