<script lang="ts">
  import type { ActiveResponse } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';
  import StreamingCodeBlock from '../blocks/StreamingCodeBlock.svelte';
  import ThinkingBlock from '../blocks/ThinkingBlock.svelte';
  import ToolBlock from '../blocks/ToolBlock.svelte';
  import ImageBlock from '../blocks/ImageBlock.svelte';

  interface Props {
    response: ActiveResponse;
  }

  let { response }: Props = $props();
</script>

<div class="streaming-row">
  <div class="bubble">
    {#each response.blockOrder as blockId (blockId)}
      {@const block = response.blocks.get(blockId)}
      {#if block}
        {#if block.blockType === 'code'}
          <StreamingCodeBlock
            content={block.content}
            language={block.language}
            done={block.status === 'done'}
          />
        {:else if block.blockType === 'thinking'}
          <ThinkingBlock content={block.content} streaming={block.status === 'streaming'} />
        {:else if block.blockType === 'tool_call'}
          <ToolBlock content={block.content} streaming={block.status === 'streaming'} />
        {:else if block.blockType === 'tool_result'}
          <ToolBlock content={block.content} isResult={true} streaming={block.status === 'streaming'} />
        {:else if block.blockType === 'image'}
          <ImageBlock src={block.imageUrl ?? ''} caption={block.imageCaption} />
        {:else if block.blockType === 'error'}
          <div class="error-block" class:streaming={block.status === 'streaming'}>
            <span class="error-code">{block.errorCode ?? 'error'}</span>
            <span class="error-text">{block.content}</span>
          </div>
        {:else}
          <div class="block-wrapper">
            <TextBlock content={block.content} streaming={block.status === 'streaming'} />
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .streaming-row {
    display: flex;
    padding: 2px 60px;
  }

  .bubble {
    max-width: min(480px, 70%);
    background: var(--bg-assistant-bubble);
    padding: 6px 10px;
    border-radius: var(--radius-bubble);
    border-top-left-radius: 4px;
    position: relative;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .bubble::before {
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

  .block-wrapper {
    margin-bottom: 6px;
  }

  .block-wrapper:last-child {
    margin-bottom: 0;
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

  .error-block.streaming {
    animation: error-pulse 1.5s ease-in-out infinite;
  }

  @keyframes error-pulse {
    0%, 100% { border-color: rgba(229, 57, 53, 0.2); }
    50% { border-color: rgba(229, 57, 53, 0.5); }
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

  @media (max-width: 768px) {
    .streaming-row {
      padding: 2px 12px;
    }

    .bubble {
      max-width: 85%;
    }
  }
</style>
