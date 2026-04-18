<script lang="ts">
  import type { ChatMessage } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';
  import CodeBlock from '../blocks/CodeBlock.svelte';
  import ThinkingBlock from '../blocks/ThinkingBlock.svelte';
  import ToolBlock from '../blocks/ToolBlock.svelte';
  import ImageBlock from '../blocks/ImageBlock.svelte';
  import { formatTime } from '../../lib/utils/time';
  import { chatStore } from '../../lib/state/chat-store.svelte';

  interface Props {
    message: ChatMessage;
  }

  let { message }: Props = $props();
  let copied = $state(false);

  async function copyMessage() {
    const text = message.blocks.length > 0
      ? message.blocks.map((b) => {
          if (b.blockType === 'code' && b.language) return '```' + b.language + '\n' + b.content + '\n```';
          return b.content;
        }).join('\n\n')
      : message.content;
    await navigator.clipboard.writeText(text);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="message-row" class:own={message.role === 'user'}>
  <div
    class="bubble"
    class:user={message.role === 'user'}
    class:assistant={message.role === 'assistant'}
    data-message-id={message.id}
  >
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
            <div class="error-header">
              <span class="error-code">{block.errorCode ?? 'error'}</span>
              <button class="retry-btn" onclick={() => chatStore.retry(message.id)} aria-label="Retry">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" /></svg>
                Retry
              </button>
            </div>
            <span class="error-text">{block.content}</span>
          </div>
        {:else}
          <TextBlock content={block.content} />
        {/if}
      {:else}
        <TextBlock content={message.content} />
      {/each}
    </div>
    <div class="bubble-meta">
      <button class="copy-btn" onclick={copyMessage} aria-label="Copy message">
        {#if copied}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
        {/if}
      </button>
      <span class="bubble-time">{formatTime(message.timestamp)}</span>
      {#if message.role === 'user'}
        <svg viewBox="0 0 16 11" width="16" height="11" class="checkmark" fill="currentColor"><path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.336.153.448.448 0 0 0 0 .636l2.357 2.458a.46.46 0 0 0 .672 0l6.529-8.06a.448.448 0 0 0-.3-.651zm-3.603 8.407L6.14 6.7l.757-.934 1.692 1.76 4.33-5.347a.457.457 0 0 1 .381-.178c.102 0 .204.038.304.102a.448.448 0 0 1 .3.651l-4.736 5.85a.46.46 0 0 1-.672 0z" /></svg>
      {/if}
    </div>
  </div>
</div>

<style>
  .message-row {
    display: flex;
    padding: 2px 60px 2px 60px;
  }

  .message-row.own {
    justify-content: flex-end;
  }

  .bubble {
    max-width: min(480px, 70%);
    position: relative;
    padding: 6px 10px 4px;
    border-radius: var(--radius-bubble);
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .bubble.assistant {
    background: var(--bg-assistant-bubble);
    border-top-left-radius: 4px;
  }

  .bubble.assistant::before {
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

  .bubble.user {
    background: var(--bg-user-bubble);
    border-top-right-radius: 4px;
  }

  .bubble.user::before {
    content: '';
    position: absolute;
    right: -8px;
    top: 0;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 8px 8px 0 0;
    border-color: var(--bg-user-bubble) transparent transparent transparent;
  }

  .bubble-content {
    line-height: 1.4;
  }

  .bubble-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    margin-top: 2px;
    min-height: 18px;
  }

  .copy-btn {
    opacity: 0;
    background: none;
    border: none;
    color: var(--text-meta);
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    display: flex;
    transition: opacity var(--duration-fast);
  }

  .bubble:hover .copy-btn {
    opacity: 0.7;
  }

  .copy-btn:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.08);
  }

  .bubble-time {
    font-size: 11px;
    color: var(--text-bubble-time);
    line-height: 1;
  }

  .checkmark {
    color: var(--text-bubble-time);
    flex-shrink: 0;
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

  .error-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
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

  .retry-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.3);
    color: var(--danger);
    font-size: 12px;
    padding: 3px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--duration-fast);
  }

  .retry-btn:hover {
    background: rgba(229, 57, 53, 0.25);
  }

  @media (max-width: 768px) {
    .message-row {
      padding: 2px 12px;
    }

    .bubble {
      max-width: 85%;
    }
  }
</style>
