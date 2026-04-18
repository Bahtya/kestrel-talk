<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import MessageBubble from './MessageBubble.svelte';
  import StreamingResponse from './StreamingResponse.svelte';
  import { scrollToBottom, isNearBottom } from '../../lib/utils/scroll';

  let listEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    const msgs = chatStore.messages;
    const active = chatStore.activeResponse;
    if (listEl && isNearBottom(listEl)) {
      // Use tick to wait for DOM update
      setTimeout(() => scrollToBottom(listEl!), false);
    }
  });
</script>

<div class="message-list" bind:this={listEl}>
  {#each chatStore.messages as msg (msg.id)}
    <MessageBubble message={msg} />
  {/each}

  {#if chatStore.activeResponse}
    <StreamingResponse response={chatStore.activeResponse} />
  {/if}

  {#if chatStore.isTyping && !chatStore.activeResponse}
    <div class="typing-indicator">
      <div class="avatar">K</div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  {/if}
</div>

<style>
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .typing-dots {
    background: var(--bg-assistant-bubble);
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    border-top-left-radius: 4px;
    display: flex;
    gap: 4px;
  }

  .typing-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-secondary);
    animation: typing-bounce 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(1) { animation-delay: 0s; }
  .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
</style>
