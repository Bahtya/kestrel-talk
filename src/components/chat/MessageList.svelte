<script lang="ts">
  import { tick } from 'svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import MessageBubble from './MessageBubble.svelte';
  import StreamingResponse from './StreamingResponse.svelte';
  import { scrollToBottom, isNearBottom } from '../../lib/utils/scroll';

  let listEl: HTMLDivElement | undefined = $state();
  let userScrolledUp = $state(false);

  function checkScroll() {
    if (!listEl) return;
    userScrolledUp = !isNearBottom(listEl, 100);
  }

  async function autoScroll() {
    if (!listEl) return;
    if (userScrolledUp) return;
    await tick();
    scrollToBottom(listEl, true);
  }

  function handleScrollToBottom() {
    if (!listEl) return;
    userScrolledUp = false;
    scrollToBottom(listEl, true);
  }

  $effect(() => {
    chatStore.messages.length;
    autoScroll();
  });

  $effect(() => {
    if (chatStore.activeResponse) {
      chatStore.activeResponse.blockOrder.length;
      autoScroll();
    }
  });
</script>

<svelte:window onkeydown={(e) => {
  if (e.key === 'End' && listEl) {
    userScrolledUp = false;
    scrollToBottom(listEl, true);
  }
}} />

<div class="message-list" bind:this={listEl} role="log" id="chat-messages" aria-label="Chat messages" aria-live="polite" onscroll={checkScroll}>
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
    <div class="message-animate-in">
      <MessageBubble message={msg} />
    </div>
  {/each}

  {#if chatStore.activeResponse}
    <div class="message-animate-in">
      <StreamingResponse response={chatStore.activeResponse} />
    </div>
  {/if}

  {#if chatStore.isTyping && !chatStore.activeResponse}
    <div class="typing-indicator" role="status" aria-label="Agent is typing">
      <div class="avatar">K</div>
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  {/if}
</div>

{#if userScrolledUp}
  <button class="scroll-to-bottom" onclick={handleScrollToBottom} aria-label="Scroll to latest messages">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
    </svg>
  </button>
{/if}

<style>
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    position: relative;
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

  .scroll-to-bottom {
    position: absolute;
    bottom: 12px;
    right: 28px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--bg-sidebar);
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: background 0.15s, transform 0.15s;
    z-index: 2;
  }

  .scroll-to-bottom:hover {
    background: var(--bg-hover);
    transform: scale(1.05);
  }
</style>
