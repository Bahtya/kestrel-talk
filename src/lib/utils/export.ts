import type { ChatMessage } from '../state/types';
import { formatTime } from './time';

export function exportChatAsMarkdown(messages: ChatMessage[]): void {
  if (messages.length === 0) return;

  const lines = messages.map((msg) => {
    const time = formatTime(msg.timestamp);
    const role = msg.role === 'user' ? 'You' : 'Agent';
    const body = msg.blocks.length > 0
      ? msg.blocks.map((b) => {
          switch (b.blockType) {
            case 'code':
              return '```' + (b.language ?? '') + '\n' + b.content + '\n```';
            case 'thinking':
              return '<details>\n<summary>Thinking</summary>\n\n' + b.content + '\n\n</details>';
            case 'tool_call':
              return '**Tool Call:**\n```json\n' + b.content + '\n```';
            case 'tool_result':
              return '**Tool Result:**\n```json\n' + b.content + '\n```';
            case 'image':
              return `![${b.imageCaption ?? 'image'}](${b.imageUrl ?? ''})`;
            case 'error':
              return `> **Error (${b.errorCode ?? 'unknown'}):** ${b.content}`;
            default:
              return b.content;
          }
        }).join('\n\n')
      : msg.content;
    return `[${time}] ${role}:\n${body}`;
  });

  const content = `# kestrel-talk Export\n${new Date().toISOString()}\n\n---\n\n` + lines.join('\n\n---\n\n');

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kestrel-talk-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
