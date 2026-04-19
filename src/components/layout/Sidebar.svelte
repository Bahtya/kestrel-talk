<script lang="ts">
  import ConnectionSettings from '../chat/ConnectionSettings.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import { exportChatAsMarkdown } from '../../lib/utils/export';
  import { formatTime } from '../../lib/utils/time';
  import { toggleTheme, getTheme } from '../../lib/utils/theme';
  import { showToast } from '../../lib/utils/storage';

  function exportChat() {
    exportChatAsMarkdown(chatStore.messages);
    showToast('Chat exported', 'success');
  }

  let theme = $state(getTheme());

  // Sync theme with external changes (keyboard shortcut)
  $effect(() => {
    const observer = new MutationObserver(() => {
      theme = document.documentElement.getAttribute('data-theme') ?? 'dark';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  });

  function handleToggleTheme() {
    theme = toggleTheme();
  }

  let lastMsg = $derived(chatStore.messages.length > 0 ? chatStore.messages[chatStore.messages.length - 1] : null);
  let lastMsgTime = $derived(lastMsg ? formatTime(lastMsg.timestamp) : '');
  let lastMsgPreview = $derived.by(() => {
    if (!lastMsg) return '';
    const text = lastMsg.blocks.length > 0 ? lastMsg.blocks[lastMsg.blocks.length - 1].content : lastMsg.content;
    return text.slice(0, 40).replace(/\n/g, ' ');
  });
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <button class="menu-btn" aria-label="Menu">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </button>
    <button class="sidebar-search" onclick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }))} aria-label="Search messages">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="search-icon"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
      <span class="search-placeholder">Search</span>
    </button>
  </div>

  <nav class="chat-list" aria-label="Chat sessions">
    <button class="chat-item active" aria-current="true">
      <div class="chat-avatar" aria-hidden="true">
        <span>K</span>
      </div>
      <div class="chat-info">
        <div class="chat-row">
          <span class="chat-name">kestrel-agent</span>
          <span class="chat-time">{lastMsgTime}</span>
        </div>
        <div class="chat-row">
          <span class="chat-preview">
            {#if chatStore.activeResponse}
              typing...
            {:else if chatStore.connectionState === 'connected'}
              {lastMsg ? lastMsgPreview : 'No messages yet'}
            {:else}
              {chatStore.connectionState}
            {/if}
          </span>
          {#if chatStore.connectionState === 'connected' && !chatStore.activeResponse}
            <span class="online-dot"></span>
          {/if}
        </div>
      </div>
    </button>
  </nav>

  <div class="sidebar-footer">
    <ConnectionSettings />
    <button class="footer-btn" onclick={handleToggleTheme} aria-label="Toggle theme" title="Toggle theme">
      {#if theme === 'dark'}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" /></svg>
      {/if}
    </button>
    <button class="footer-btn" onclick={exportChat} disabled={chatStore.messages.length === 0} aria-label="Export chat" title="Export chat">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
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
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    height: 56px;
  }

  .menu-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    transition: background var(--duration-fast);
  }

  .menu-btn:hover {
    background: var(--bg-hover);
  }

  .sidebar-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-search);
    border-radius: 22px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background var(--duration-fast);
  }

  .sidebar-search:hover {
    background: var(--bg-hover);
  }

  .search-icon {
    color: var(--text-meta);
    flex-shrink: 0;
  }

  .search-placeholder {
    color: var(--text-meta);
    font-size: 14px;
  }

  .chat-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .chat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
    transition: background var(--duration-fast);
  }

  .chat-item:hover {
    background: var(--bg-hover);
  }

  .chat-item.active {
    background: var(--bg-user-bubble);
  }

  .chat-avatar {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .chat-info {
    flex: 1;
    min-width: 0;
  }

  .chat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .chat-row + .chat-row {
    margin-top: 3px;
  }

  .chat-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-time {
    font-size: 12px;
    color: var(--text-meta);
    flex-shrink: 0;
  }

  .chat-preview {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .online-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent-online);
    flex-shrink: 0;
  }

  .sidebar-footer {
    padding: 8px 12px;
    border-top: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .footer-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    transition: background var(--duration-fast), color var(--duration-fast);
    flex-shrink: 0;
    display: flex;
  }

  .footer-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .footer-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>
