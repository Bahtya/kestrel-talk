import { Marked } from 'marked';
import { markdownV2, validateMarkdownV2 } from './markdown-v2';
import { isHtml, sanitizeHtml } from './html-sanitizer';

const standardMarkdown = new Marked({
  gfm: true,
  breaks: true,
});

export function renderContent(content: string): string {
  // Level 1: HTML passthrough
  if (isHtml(content)) {
    return sanitizeHtml(content);
  }

  // Level 2: Try Telegram MarkdownV2
  const v2Result = validateMarkdownV2(content);
  if (v2Result.valid) {
    try {
      const html = markdownV2.parse(content);
      if (typeof html === 'string') {
        return sanitizeHtml(html);
      }
      // If async (shouldn't happen with sync parse), fall through
    } catch {
      // MarkdownV2 parse failed, fall through to standard
    }
  }

  // Level 3: Standard Markdown (marked)
  const html = standardMarkdown.parse(content);
  if (typeof html === 'string') {
    return sanitizeHtml(html);
  }

  // Fallback: plain text
  return sanitizeHtml(content);
}
