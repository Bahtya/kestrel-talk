<script lang="ts">
  import MessageList from '../chat/MessageList.svelte';
  import MessageInput from '../chat/MessageInput.svelte';
  import SearchBar from '../chat/SearchBar.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';

  let sidebarOpen = $state(false);
  let searchOpen = $state(false);

  function handleSend(text: string) {
    chatStore.send(text);
  }

  function toggleSearch(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchOpen = !searchOpen;
    }
  }
</script>

<svelte:window onkeydown={toggleSearch} />

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
    <button class="search-btn" onclick={() => { searchOpen = !searchOpen; }} aria-label="Search messages">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    </button>
  </header>

  {#if searchOpen}
    <SearchBar onclose={() => { searchOpen = false; }} />
  {/if}

  <MessageList />

  <MessageInput onsend={handleSend} />
</div>

{#if sidebarOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sidebar-overlay" role="button" tabindex="-1" onclick={() => { sidebarOpen = false; }} onkeydown={(e) => { if (e.key === 'Escape') sidebarOpen = false; }}></div>
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

  .chat-header-info {
    flex: 1;
    min-width: 0;
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

  .search-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .search-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
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
