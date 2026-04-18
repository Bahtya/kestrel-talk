<script lang="ts">
  import MessageList from '../chat/MessageList.svelte';
  import MessageInput from '../chat/MessageInput.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';

  let sidebarOpen = $state(false);

  function handleSend(text: string) {
    chatStore.send(text);
  }
</script>

<div class="chat-area">
  <header class="chat-header">
    <button class="menu-btn" onclick={() => { sidebarOpen = !sidebarOpen; }} aria-label="Toggle sidebar">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
    <div class="chat-header-info">
      <div class="chat-header-name">kestrel-agent</div>
      <div class="chat-header-status">
        {chatStore.isTyping ? 'typing...' : chatStore.connectionState === 'connected' ? 'online' : chatStore.connectionState}
      </div>
    </div>
  </header>

  <MessageList />

  <MessageInput onsend={handleSend} />
</div>

{#if sidebarOpen}
  <div class="sidebar-overlay" onclick={() => { sidebarOpen = false; }}></div>
{/if}

<style>
  .chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-chat);
    min-width: 0;
  }

  .chat-header {
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bg-sidebar);
  }

  .menu-btn {
    display: none;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }

  .menu-btn:hover {
    background: var(--bg-hover);
  }

  .chat-header-name {
    font-size: 15px;
    font-weight: 600;
  }

  .chat-header-status {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 1px;
  }

  .sidebar-overlay {
    display: none;
  }

  @media (max-width: 768px) {
    .menu-btn {
      display: flex;
    }

    .sidebar-overlay {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 5;
    }
  }
</style>
