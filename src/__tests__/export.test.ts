// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportChatAsMarkdown } from '../lib/utils/export';

const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:test-url');

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.URL.createObjectURL = mockCreateObjectURL;
  globalThis.URL.revokeObjectURL = mockRevokeObjectURL;
});

describe('exportChatAsMarkdown', () => {
  it('does nothing with empty messages', () => {
    exportChatAsMarkdown([]);
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  it('creates blob with markdown type for user message', () => {
    const messages = [{
      id: '1',
      role: 'user' as const,
      content: 'Hello!',
      blocks: [],
      timestamp: new Date('2026-01-15T10:00:00Z'),
    }];

    exportChatAsMarkdown(messages);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/markdown');
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });

  it('includes message role labels in output', async () => {
    const messages = [{
      id: '1',
      role: 'user' as const,
      content: 'test content',
      blocks: [],
      timestamp: new Date('2026-01-15T10:00:00Z'),
    }];

    exportChatAsMarkdown(messages);

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain('You:');
    expect(text).toContain('test content');
    expect(text).toContain('# kestrel-talk Export');
  });

  it('formats code blocks with language tags', async () => {
    const messages = [{
      id: '1',
      role: 'assistant' as const,
      content: '',
      blocks: [
        { id: 'b1', responseId: 'r1', blockType: 'code' as const, language: 'rust', content: 'fn main() {}', status: 'done' as const },
      ],
      timestamp: new Date('2026-01-15T10:00:00Z'),
    }];

    exportChatAsMarkdown(messages);

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain('```rust');
    expect(text).toContain('fn main() {}');
  });

  it('handles multiple messages', async () => {
    const messages = [
      { id: '1', role: 'user' as const, content: 'hi', blocks: [], timestamp: new Date() },
      { id: '2', role: 'assistant' as const, content: 'hello', blocks: [{ id: 'b1', responseId: 'r1', blockType: 'text' as const, language: null, content: 'hello', status: 'done' as const }], timestamp: new Date() },
    ];

    exportChatAsMarkdown(messages);

    const blob = mockCreateObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    expect(text).toContain('You:');
    expect(text).toContain('Agent:');
  });
});
