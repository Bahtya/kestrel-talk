<script lang="ts">
  import type { ActiveResponse } from '../../lib/state/types';
  import TextBlock from '../blocks/TextBlock.svelte';

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
        {#if block.blockType === 'text'}
          <div class="streaming-block">
            <TextBlock content={block.content} streaming={block.status === 'streaming'} />
          </div>
        {:else if block.blockType === 'code'}
          <div class="streaming-code-block" class:done={block.status === 'done'}>
            {#if block.language}
              <div class="code-lang">{block.language}</div>
            {/if}
            <pre><code>{block.content}</code></pre>
            {#if block.status === 'streaming'}
              <span class="cursor"></span>
            {/if}
          </div>
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

  .streaming-code-block {
    background: var(--bg-code);
    border-radius: var(--radius-md);
    margin: 8px 0;
    overflow: hidden;
  }

  .code-lang {
    font-size: 12px;
    color: var(--text-meta);
    padding: 6px 12px 0;
    text-transform: lowercase;
    font-family: var(--font-mono);
  }

  .streaming-code-block pre {
    padding: 8px 12px;
    margin: 0;
    overflow-x: auto;
  }

  .streaming-code-block code {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-primary);
    white-space: pre;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--text-primary);
    margin-left: 2px;
    animation: blink 1s step-end infinite;
    vertical-align: text-bottom;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>
