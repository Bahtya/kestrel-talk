<script lang="ts">
  import { renderContent } from '../../lib/utils/markdown';

  interface Props {
    content: string;
    isResult?: boolean;
    toolName?: string;
    streaming?: boolean;
  }

  let { content, isResult = false, toolName, streaming = false }: Props = $props();
  let expanded = $state(false);

  let renderedHtml = $derived(renderContent(content));
</script>

<details class="tool-block" class:result={isResult} bind:open={expanded}>
  <summary class="tool-header">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="icon">
      {#if isResult}
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      {:else}
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
      {/if}
    </svg>
    <span class="tool-label">{isResult ? 'Result' : toolName ?? 'Tool Call'}</span>
    {#if streaming}
      <span class="tool-badge">running</span>
    {/if}
  </summary>
  <div class="tool-content">
    {@html renderedHtml}
  </div>
</details>

<style>
  .tool-block {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    margin: 8px 0;
    overflow: hidden;
  }

  .tool-block.result {
    border-color: rgba(76, 175, 80, 0.2);
  }

  .tool-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    user-select: none;
    list-style: none;
  }

  .tool-header::-webkit-details-marker {
    display: none;
  }

  .icon {
    flex-shrink: 0;
    opacity: 0.6;
  }

  .tool-label {
    font-weight: 500;
  }

  .tool-badge {
    font-size: 11px;
    color: var(--accent);
    background: rgba(82, 136, 193, 0.1);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .tool-content {
    padding: 8px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    max-height: 300px;
    overflow-y: auto;
  }
</style>
