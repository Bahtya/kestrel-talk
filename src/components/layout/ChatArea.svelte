<script lang="ts">
  import MessageList from '../chat/MessageList.svelte';
  import MessageInput from '../chat/MessageInput.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';

  function handleSend(text: string) {
    chatStore.send(text);
  }
</script>

<div class="chat-area">
  <header class="chat-header">
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
    background: var(--bg-sidebar);
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
</style>
