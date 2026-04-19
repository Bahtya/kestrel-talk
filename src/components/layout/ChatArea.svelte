<script lang="ts">
  import MessageList from '../chat/MessageList.svelte';
  import MessageInput from '../chat/MessageInput.svelte';
  import SearchBar from '../chat/SearchBar.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import { toggleTheme } from '../../lib/utils/theme';

  interface Props {
    ontogglemenu?: () => void;
    onclosemenu?: () => void;
    mobileMenuOpen?: boolean;
  }

  let { ontogglemenu, onclosemenu, mobileMenuOpen = false }: Props = $props();
  let searchOpen = $state(false);

  function handleSend(text: string) {
    chatStore.send(text);
  }

  function toggleSearch(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      searchOpen = !searchOpen;
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      toggleTheme();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      chatStore.addSystemMessage(`**Keyboard shortcuts:**
Enter — Send message
Shift+Enter — New line
Ctrl+F — Search messages
Ctrl+Shift+T — Toggle theme
Ctrl+/ — Show this help
↑ / ↓ — Navigate input history
End — Scroll to bottom
Escape — Close search/sidebar`);
    }
  }

  let statusText = $derived(() => {
    if (chatStore.isTyping) return 'typing...';
    if (chatStore.connectionState === 'connected') return 'online';
    if (chatStore.connectionState === 'connecting') return 'connecting...';
    if (chatStore.connectionState === 'error') return 'last seen recently';
    return 'offline';
  });

  let isOnline = $derived(chatStore.connectionState === 'connected' && !chatStore.isTyping);
</script>

<svelte:window onkeydown={toggleSearch} />

<div class="chat-area">
  <header class="chat-header">
    <button class="menu-btn" onclick={ontogglemenu} aria-label="Toggle sidebar">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </button>
    <div class="header-avatar">
      <span>K</span>
    </div>
    <div class="header-info">
      <div class="header-name">kestrel-agent</div>
      <div class="header-status" class:online={isOnline}>
        {statusText()}
      </div>
    </div>
    <div class="header-actions">
      <button class="header-btn" onclick={() => { searchOpen = !searchOpen; }} aria-label="Search messages">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
      </button>
      <button class="header-btn" aria-label="More options">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
      </button>
    </div>
  </header>

  {#if searchOpen}
    <SearchBar onclose={() => { searchOpen = false; }} />
  {/if}

  <MessageList />

  <MessageInput onsend={handleSend} />
</div>

{#if mobileMenuOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="sidebar-overlay" role="button" tabindex="-1" onclick={onclosemenu} onkeydown={(e) => { if (e.key === 'Escape') onclosemenu?.(); }}></div>
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
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 16px;
    height: 56px;
    background: var(--bg-sidebar);
    border-bottom: none;
  }

  .menu-btn {
    display: none;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background var(--duration-fast);
  }

  .menu-btn:hover {
    background: var(--bg-hover);
  }

  .header-avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .header-info {
    flex: 1;
    min-width: 0;
  }

  .header-name {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
  }

  .header-status {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.3;
  }

  .header-status.online {
    color: var(--accent-online);
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }

  .header-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    transition: background var(--duration-fast), color var(--duration-fast);
  }

  .header-btn:hover {
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
      background: rgba(0, 0, 0, 0.4);
      z-index: var(--z-overlay);
    }
  }
</style>
