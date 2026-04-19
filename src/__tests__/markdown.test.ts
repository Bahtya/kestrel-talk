// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderContent } from '../lib/utils/markdown';

describe('renderContent', () => {
  it('renders standard markdown', () => {
    const result = renderContent('**bold** and _italic_');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
  });

  it('renders inline code', () => {
    const result = renderContent('Use `cargo run` to execute');
    expect(result).toContain('<code>cargo run</code>');
  });

  it('renders links', () => {
    const result = renderContent('[kestrel](https://example.com)');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('kestrel');
  });

  it('opens links in new tab with noopener', () => {
    const result = renderContent('[link](https://example.com)');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('renders HTML passthrough', () => {
    const result = renderContent('<div class="test">hello</div>');
    expect(result).toContain('hello');
    expect(result).toContain('<div');
  });

  it('sanitizes XSS in HTML', () => {
    const result = renderContent('<img src=x onerror=alert(1)>');
    expect(result).not.toContain('onerror');
  });

  it('sanitizes XSS in markdown links', () => {
    const result = renderContent('[click](javascript:alert(1))');
    expect(result).not.toContain('javascript:');
  });

  it('renders code blocks', () => {
    const result = renderContent('```\nlet x = 1;\n```');
    expect(result).toContain('<code>');
    expect(result).toContain('let x = 1');
  });

  it('handles plain text', () => {
    const result = renderContent('just some text');
    expect(result).toContain('just some text');
  });

  it('returns empty string for empty content', () => {
    expect(renderContent('')).toBe('');
    expect(renderContent('   ')).toBe('');
  });

  it('renders markdown lists', () => {
    const result = renderContent('- item 1\n- item 2');
    expect(result).toContain('<li>');
  });

  it('renders blockquotes', () => {
    const result = renderContent('> quoted text');
    expect(result).toContain('<blockquote');
  });

  it('renders strikethrough', () => {
    const result = renderContent('~~deleted~~');
    expect(result).toContain('<del>deleted</del>');
  });

  it('renders spoilers without inline onclick', () => {
    const result = renderContent('This is ||secret|| text');
    expect(result).toContain('<span class="spoiler">secret</span>');
    expect(result).not.toContain('onclick');
  });

  it('renders MarkdownV2 underline', () => {
    const result = renderContent('__underlined text__');
    expect(result).toContain('<u>underlined text</u>');
  });

  it('renders MarkdownV2 single-tilde strikethrough', () => {
    const result = renderContent('~struck~');
    expect(result).toContain('<s>struck</s>');
  });

  it('renders nested bold and italic', () => {
    const result = renderContent('***bold italic***');
    expect(result).toContain('<strong>');
    expect(result).toContain('<em>');
  });

  it('renders line breaks with breaks option', () => {
    const result = renderContent('line 1\nline 2');
    expect(result).toContain('<br>');
  });

  it('strips script tags from HTML passthrough', () => {
    const result = renderContent('<div>safe</div><script>alert(1)</script>');
    expect(result).not.toContain('<script');
    expect(result).toContain('safe');
  });

  it('renders markdown image', () => {
    const result = renderContent('![alt text](https://example.com/img.png)');
    expect(result).toContain('<img');
    expect(result).toContain('alt="alt text"');
  });

  it('renders link with target blank', () => {
    const result = renderContent('[link](https://example.com)');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('renders heading levels', () => {
    const result = renderContent('## Heading');
    expect(result).toContain('<h2');
  });

  it('handles deeply nested markdown', () => {
    const result = renderContent('> **bold** and `code`');
    expect(result).toContain('<blockquote');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<code>code</code>');
  });
});
