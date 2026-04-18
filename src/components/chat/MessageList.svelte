<script lang="ts">
  import { tick } from 'svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import MessageBubble from './MessageBubble.svelte';
  import StreamingResponse from './StreamingResponse.svelte';
  import { scrollToBottom, isNearBottom } from '../../lib/utils/scroll';

  let listEl: HTMLDivElement | undefined = $state();

  async function autoScroll() {
    if (!listEl) return;
    await tick();
    if (isNearBottom(listEl, 200)) {
      scrollToBottom(listEl, true);
    }
  }

  // React to message count changes
  $effect(() => {
    chatStore.messages.length;
    autoScroll();
  });

  // React to active response block changes
  $effect(() => {
    if (chatStore.activeResponse) {
      chatStore.activeResponse.blockOrder.length;
      autoScroll();
    }
  });
</script>

<div class="message-list" bind:this={listEl}>
  {#if chatStore.messages.length === 0 && !chatStore.activeResponse}
    <div class="empty-state">
      <div class="empty-icon">K</div>
      <div class="empty-text">
        {#if chatStore.connectionState === 'connected'}
          Send a message to start chatting
        {:else}
          Connect to kestrel-agent to start chatting
        {/if}
      </div>
    </div>
  {/if}

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
    display: flex;
    flex-direction: column;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
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
