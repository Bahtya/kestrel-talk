<script lang="ts">
  import type { ActiveResponse } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';
  import StreamingCodeBlock from '../blocks/StreamingCodeBlock.svelte';
  import ThinkingBlock from '../blocks/ThinkingBlock.svelte';
  import ToolBlock from '../blocks/ToolBlock.svelte';

  interface Props {
    response: ActiveResponse;
  }

  let { response }: Props = $props();
</script>

<div class="streaming-response">
  <div class="avatar">K</div>
  <div class="response-content">
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
        {:else}
          <div class="streaming-block">
            <TextBlock content={block.content} streaming={block.status === 'streaming'} />
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .streaming-response {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    max-width: 80%;
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

  .response-content {
    background: var(--bg-assistant-bubble);
    border-radius: var(--radius-lg);
    border-top-left-radius: 4px;
    padding: 10px 14px;
    min-width: 40px;
  }

  .streaming-block {
    margin-bottom: 8px;
  }

  .streaming-block:last-child {
    margin-bottom: 0;
  }
</style>
