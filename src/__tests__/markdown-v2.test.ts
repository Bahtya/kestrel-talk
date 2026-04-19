import { describe, it, expect } from 'vitest';
import { validateMarkdownV2 } from '../lib/utils/markdown-v2';

describe('validateMarkdownV2', () => {
  it('validates simple text', () => {
    const result = validateMarkdownV2('Hello world');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validates balanced spoiler markers', () => {
    const result = validateMarkdownV2('This is ||spoiler|| text');
    expect(result.valid).toBe(true);
  });

  it('rejects unbalanced spoiler markers', () => {
    const result = validateMarkdownV2('This is ||spoiler text');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates balanced strikethrough markers', () => {
    const result = validateMarkdownV2('This is ~deleted~ text');
    expect(result.valid).toBe(true);
  });

  it('rejects unbalanced strikethrough markers', () => {
    const result = validateMarkdownV2('This is ~ text');
    expect(result.valid).toBe(false);
  });

  it('validates text with no special markers', () => {
    const result = validateMarkdownV2('Just plain text with *bold* and _italic_');
    expect(result.valid).toBe(true);
  });

  it('validates balanced underline markers', () => {
    const result = validateMarkdownV2('This is __underlined__ text');
    expect(result.valid).toBe(true);
  });

  it('rejects unbalanced underline markers', () => {
    const result = validateMarkdownV2('This is __unbalanced text');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
