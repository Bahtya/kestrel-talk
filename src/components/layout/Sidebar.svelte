<script lang="ts">
  import ConnectionStatus from '../chat/ConnectionStatus.svelte';
  import ConnectionSettings from '../chat/ConnectionSettings.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import { formatTime } from '../../lib/utils/time';

  function exportChat() {
    if (chatStore.messages.length === 0) return;

    const lines = chatStore.messages.map((msg) => {
      const time = formatTime(msg.timestamp);
      const role = msg.role === 'user' ? 'You' : 'Agent';
      const body = msg.blocks.length > 0
        ? msg.blocks.map((b) => {
            if (b.blockType === 'code' && b.language) return '```' + b.language + '\n' + b.content + '\n```';
            return b.content;
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
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <h1 class="sidebar-title">kestrel-talk</h1>
  </div>

  <nav class="session-list" aria-label="Chat sessions">
    <button class="session-item active" aria-current="true">
      <div class="session-avatar" aria-hidden="true">K</div>
      <div class="session-info">
        <div class="session-name">kestrel-agent</div>
        <div class="session-preview">
          {chatStore.connectionState === 'connected' ? 'online' : chatStore.connectionState}
        </div>
      </div>
    </button>
  </nav>

  <div class="sidebar-footer">
    <div class="footer-left">
      <ConnectionSettings />
      <ConnectionStatus />
    </div>
    <button class="export-btn" onclick={exportChat} disabled={chatStore.messages.length === 0} aria-label="Export chat" title="Export chat as markdown">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    width: 300px;
    min-width: 300px;
    height: 100%;
    background: var(--bg-sidebar);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
  }

  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .session-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .session-item:hover {
    background: var(--bg-hover);
  }

  .session-item.active {
    background: var(--bg-hover);
  }

  .session-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .session-info {
    overflow: hidden;
  }

  .session-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-preview {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .export-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }

  .export-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .export-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>
