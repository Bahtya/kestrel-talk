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
});
