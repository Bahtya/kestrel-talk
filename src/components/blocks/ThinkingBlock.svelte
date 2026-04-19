<script lang="ts">
  import { renderContent } from '../../lib/utils/markdown';

  interface Props {
    content: string;
    streaming?: boolean;
  }

  let { content, streaming = false }: Props = $props();
  let expanded = $state(false);

  let renderedHtml = $derived(renderContent(content));
  let ariaLabel = $derived(streaming ? 'AI thinking process (streaming)' : 'AI thinking process');
</script>

<details class="thinking-block" bind:open={expanded}>
  <summary class="thinking-header" aria-label={ariaLabel}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="chevron">
      <path d="M7 10l5 5 5-5z" />
    </svg>
    <span>Thinking</span>
    {#if streaming}
      <span class="thinking-badge">...</span>
    {/if}
  </summary>
  <div class="thinking-content">
    {@html renderedHtml}
  </div>
</details>

<style>
  .thinking-block {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    margin: 8px 0;
    overflow: hidden;
  }

  .thinking-header {
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

  .thinking-header::-webkit-details-marker {
    display: none;
  }

  .chevron {
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .thinking-block[open] .chevron {
    transform: rotate(180deg);
  }

  .thinking-badge {
    color: var(--text-meta);
    font-size: 12px;
  }

  .thinking-content {
    padding: 8px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
