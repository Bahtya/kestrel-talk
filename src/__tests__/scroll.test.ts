// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { scrollToBottom, isNearBottom } from '../lib/utils/scroll';

describe('scroll utils', () => {
  function createScrollable(height: number, scrollHeight: number) {
    const el = document.createElement('div');
    el.style.height = `${height}px`;
    el.style.overflow = 'auto';
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    return el;
  }

  it('isNearBottom returns true when near bottom', () => {
    const el = createScrollable(200, 300);
    Object.defineProperty(el, 'scrollTop', { value: 99, configurable: true });
    expect(isNearBottom(el, 100)).toBe(true);
  });

  it('isNearBottom returns false when scrolled up', () => {
    const el = createScrollable(200, 1000);
    Object.defineProperty(el, 'scrollTop', { value: 100, configurable: true });
    expect(isNearBottom(el, 100)).toBe(false);
  });

  it('isNearBottom uses default threshold', () => {
    const el = createScrollable(200, 300);
    Object.defineProperty(el, 'scrollTop', { value: 199, configurable: true });
    expect(isNearBottom(el)).toBe(true);
  });

  it('scrollToBottom calls scrollTo', () => {
    const el = createScrollable(200, 1000);
    let called = false;
    el.scrollTo = ((opts: ScrollToOptions | number) => { called = true; }) as typeof el.scrollTo;
    scrollToBottom(el, false);
    expect(called).toBe(true);
  });
});
