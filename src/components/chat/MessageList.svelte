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
    if (!listEl || userScrolledUp) return;
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

  function getDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = today.getTime() - msgDate.getTime();
    if (diff === 0) return 'Today';
    if (diff <= 86400000) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
  }

  function shouldShowDate(messages: { timestamp: Date }[], index: number): boolean {
    if (index === 0) return true;
    const prev = messages[index - 1].timestamp;
    const curr = messages[index].timestamp;
    return prev.toDateString() !== curr.toDateString();
  }
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
      <div class="empty-title">kestrel-agent</div>
      <div class="empty-text">
        {#if chatStore.connectionState === 'connected'}
          Send a message to start chatting
        {:else}
          Connect to kestrel-agent to start chatting
        {/if}
      </div>
      <div class="empty-hints">
        <span class="hint"><kbd>Enter</kbd> Send</span>
        <span class="hint"><kbd>Ctrl+F</kbd> Search</span>
        <span class="hint"><kbd>↑↓</kbd> History</span>
        <span class="hint"><kbd>/help</kbd> Commands</span>
      </div>
    </div>
  {/if}

  {#each chatStore.messages as msg, i (msg.id)}
    {#if shouldShowDate(chatStore.messages, i)}
      <div class="date-separator">
        <span>{getDateLabel(msg.timestamp)}</span>
      </div>
    {/if}
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
    <div class="typing-row">
      <div class="typing-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if userScrolledUp}
  <button class="scroll-to-bottom" onclick={handleScrollToBottom} aria-label="Scroll to latest messages">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
  </button>
{/if}

<style>
  .message-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    position: relative;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231c2a3a' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") var(--bg-chat);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
  }

  .empty-icon {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 700;
    color: white;
    opacity: 0.5;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .empty-text {
    color: var(--text-secondary);
    font-size: 14px;
  }

  .empty-hints {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .hint {
    font-size: 12px;
    color: var(--text-meta);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hint kbd {
    background: var(--bg-hover);
    border: 1px solid var(--border-light);
    border-radius: 4px;
    padding: 1px 5px;
    font-family: var(--font-sans);
    font-size: 11px;
    color: var(--text-secondary);
  }

  .typing-row {
    display: flex;
    padding: 2px 60px;
  }

  .typing-bubble {
    background: var(--bg-assistant-bubble);
    padding: 10px 16px;
    border-radius: var(--radius-bubble);
    border-top-left-radius: 4px;
    position: relative;
    max-width: 80px;
  }

  .typing-bubble::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 8px 8px 0;
    border-color: transparent var(--bg-assistant-bubble) transparent transparent;
  }

  .typing-dots {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
  }

  .typing-dots span {
    width: 7px;
    height: 7px;
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
    right: 24px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--bg-sidebar);
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    transition: background var(--duration-fast), transform var(--duration-fast);
    z-index: 2;
  }

  .scroll-to-bottom:hover {
    background: var(--bg-hover);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .message-list {
      padding: 8px 0;
    }

    .typing-row {
      padding: 2px 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .typing-dots span {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
