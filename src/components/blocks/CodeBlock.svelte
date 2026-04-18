<script lang="ts">
  import { highlightCode } from '../../lib/utils/highlighter';

  interface Props {
    code: string;
    language?: string | null;
  }

  let { code, language = null }: Props = $props();

  let highlighted = $state('');
  let copied = $state(false);
  let lineCount = $derived(code.split('\n').length);

  $effect(() => {
    highlightCode(code, language ?? 'text').then((h) => { highlighted = h; });
  });

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => { copied = false; }, 2000);
  }
</script>

<div class="code-block" role="region" aria-label="{language || 'text'} code block">
  <div class="code-header">
    <span class="code-lang">{language || 'text'}</span>
    <button class="copy-btn" onclick={copyCode} aria-label="Copy code">
      {copied ? 'Copied!' : 'Copy'}
    </button>
  </div>
  <div class="code-content">
    <div class="line-numbers" aria-hidden="true">
      {#each Array(lineCount) as _, i}
        <span>{i + 1}</span>
      {/each}
    </div>
    <div class="code-body">
      {#if highlighted}
        {@html highlighted}
      {:else}
        <pre><code>{code}</code></pre>
      {/if}
    </div>
  </div>
</div>

<style>
  .code-block {
    background: var(--bg-code);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin: 8px 0;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .code-lang {
    font-size: 12px;
    color: var(--text-meta);
    text-transform: lowercase;
    font-family: var(--font-mono);
  }

  .copy-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary);
  }

  .code-content {
    display: flex;
    overflow-x: auto;
  }

  .line-numbers {
    display: flex;
    flex-direction: column;
    padding: 12px 8px 12px 12px;
    text-align: right;
    user-select: none;
    flex-shrink: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .line-numbers span {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-meta);
    opacity: 0.5;
  }

  .code-body {
    padding: 12px;
    overflow-x: auto;
    flex: 1;
    min-width: 0;
  }

  .code-body :global(pre) {
    margin: 0;
    background: none !important;
    padding: 0 !important;
  }

  .code-body :global(code) {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
  }
</style>
