<script lang="ts">
  import type { ChatMessage } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';

  interface Props {
    message: ChatMessage;
  }

  let { message }: Props = $props();

  function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="message-bubble" class:user={message.role === 'user'} class:assistant={message.role === 'assistant'}>
  {#if message.role === 'assistant'}
    <div class="avatar">K</div>
  {/if}

  <div class="bubble-content">
    {#each message.blocks as block (block.id)}
      <TextBlock content={block.content} />
    {:else}
      <TextBlock content={message.content} />
    {/each}
    <div class="message-meta">{formatTime(message.timestamp)}</div>
  </div>
</div>

<style>
  .message-bubble {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    max-width: 80%;
  }

  .message-bubble.user {
    flex-direction: row-reverse;
    margin-left: auto;
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

  .bubble-content {
    padding: 10px 14px;
    border-radius: var(--radius-lg);
    line-height: 1.5;
  }

  .assistant .bubble-content {
    background: var(--bg-assistant-bubble);
    border-top-left-radius: 4px;
  }

  .user .bubble-content {
    background: var(--bg-user-bubble);
    border-top-right-radius: 4px;
    color: white;
  }

  .message-meta {
    font-size: 11px;
    color: var(--text-meta);
    margin-top: 4px;
    text-align: right;
  }
</style>
