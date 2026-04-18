<script lang="ts">
  import type { ChatMessage } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';
  import CodeBlock from '../blocks/CodeBlock.svelte';
  import ThinkingBlock from '../blocks/ThinkingBlock.svelte';
  import ToolBlock from '../blocks/ToolBlock.svelte';
  import ImageBlock from '../blocks/ImageBlock.svelte';

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
      {#if block.blockType === 'code'}
        <CodeBlock code={block.content} language={block.language} />
      {:else if block.blockType === 'thinking'}
        <ThinkingBlock content={block.content} />
      {:else if block.blockType === 'tool_call'}
        <ToolBlock content={block.content} />
      {:else if block.blockType === 'tool_result'}
        <ToolBlock content={block.content} isResult={true} />
      {:else if block.blockType === 'image'}
        <ImageBlock src={block.imageUrl ?? ''} caption={block.imageCaption} />
      {:else if block.blockType === 'error'}
        <div class="error-block">
          <span class="error-code">{block.errorCode ?? 'error'}</span>
          <span class="error-text">{block.content}</span>
        </div>
      {:else}
        <TextBlock content={block.content} />
      {/if}
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

  .error-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 12px;
    background: rgba(229, 57, 53, 0.1);
    border: 1px solid rgba(229, 57, 53, 0.2);
    border-radius: var(--radius-sm);
    font-size: 13px;
  }

  .error-code {
    font-weight: 600;
    color: var(--danger);
    font-family: var(--font-mono);
    font-size: 12px;
    text-transform: uppercase;
  }

  .error-text {
    color: var(--text-secondary);
  }
</style>
