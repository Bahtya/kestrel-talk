<script lang="ts">
  import { renderContent } from '../../lib/utils/markdown';

  interface Props {
    content: string;
    streaming?: boolean;
  }

  let { content, streaming = false }: Props = $props();

  let renderedHtml = $derived(renderContent(content));
</script>

<div class="text-block" class:streaming>
  {@html renderedHtml}
  {#if streaming}
    <span class="cursor"></span>
  {/if}
</div>

<style>
  .text-block {
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .text-block :global(p) {
    margin: 0 0 8px;
  }

  .text-block :global(p:last-child) {
    margin-bottom: 0;
  }

  .text-block :global(code) {
    background: rgba(255, 255, 255, 0.08);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .text-block :global(pre) {
    background: var(--bg-code);
    padding: 12px;
    border-radius: var(--radius-md);
    overflow-x: auto;
    margin: 8px 0;
  }

  .text-block :global(pre code) {
    background: none;
    padding: 0;
  }

  .text-block :global(a) {
    color: var(--accent);
    text-decoration: none;
  }

  .text-block :global(a:hover) {
    text-decoration: underline;
  }

  .text-block :global(blockquote) {
    border-left: 3px solid var(--accent);
    padding-left: 12px;
    margin: 8px 0;
    color: var(--text-secondary);
  }

  .text-block :global(ul), .text-block :global(ol) {
    padding-left: 20px;
    margin: 8px 0;
  }

  .text-block :global(li) {
    margin: 4px 0;
  }

  .text-block :global(.spoiler) {
    background: rgba(255, 255, 255, 0.15);
    color: transparent;
    border-radius: 3px;
    padding: 0 4px;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
  }

  .text-block :global(.spoiler.revealed) {
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
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
