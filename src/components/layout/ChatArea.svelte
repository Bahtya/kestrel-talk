<script lang="ts">
  import MessageInput from '../chat/MessageInput.svelte';

  let messages: { id: string; role: string; content: string }[] = [];
</script>

<div class="chat-area">
  <header class="chat-header">
    <div class="chat-header-info">
      <div class="chat-header-name">kestrel-agent</div>
      <div class="chat-header-status">waiting for connection</div>
    </div>
  </header>

  <div class="message-list">
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">K</div>
        <div class="empty-text">Connect to kestrel-agent to start chatting</div>
      </div>
    {/if}
  </div>

  <MessageInput onsend={(text) => {}} />
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

  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 16px;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
    color: white;
    opacity: 0.6;
  }

  .empty-text {
    color: var(--text-secondary);
    font-size: 14px;
  }
</style>
