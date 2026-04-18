// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { isHtml, sanitizeHtml } from '../lib/utils/html-sanitizer';

describe('isHtml', () => {
  it('detects div tag', () => {
    expect(isHtml('<div>hello</div>')).toBe(true);
  });

  it('detects self-closing br', () => {
    expect(isHtml('<br/>')).toBe(true);
  });

  it('detects tag with attributes', () => {
    expect(isHtml('<a href="https://example.com">link</a>')).toBe(true);
  });

  it('does not false-positive on markdown', () => {
    expect(isHtml('# Hello World')).toBe(false);
  });

  it('does not false-positive on plain text', () => {
    expect(isHtml('Hello **bold** text')).toBe(false);
  });

  it('does not false-positive on code fences', () => {
    expect(isHtml('```rust\nfn main() {}\n```')).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('allows safe tags', () => {
    const html = '<b>bold</b> <i>italic</i>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
  });

  it('strips script tags', () => {
    const html = '<script>alert("xss")</script><p>safe</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('script');
    expect(result).toContain('safe');
  });

  it('strips onclick attributes', () => {
    const html = '<div onclick="alert(1)">click</div>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
  });

  it('allows href on anchor tags', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('href');
  });

  it('strips javascript: URLs', () => {
    const html = '<a href="javascript:alert(1)">evil</a>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('javascript:');
  });
});
