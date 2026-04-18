<script lang="ts">
  import { highlightCode, loadLanguage } from '../../lib/utils/highlighter';

  interface Props {
    content: string;
    language?: string | null;
    done?: boolean;
  }

  let { content, language = null, done = false }: Props = $props();

  let highlighted = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    const c = content;
    const d = done;
    const l = language;

    // Try loading the language on first encounter
    if (l) loadLanguage(l);

    if (d) {
      debounceTimer && clearTimeout(debounceTimer);
      highlightCode(c, l ?? 'text').then((h) => { highlighted = h; });
    } else {
      debounceTimer && clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        highlightCode(c, l ?? 'text').then((h) => { highlighted = h; });
      }, 150);
    }

    return () => {
      debounceTimer && clearTimeout(debounceTimer);
    };
  });
</script>

<div class="streaming-code-block" class:done>
  {#if language}
    <div class="code-lang">{language}</div>
  {/if}
  <div class="code-content">
    {#if highlighted}
      {@html highlighted}
    {:else}
      <pre><code>{content}</code></pre>
    {/if}
    {#if !done}
      <span class="cursor"></span>
    {/if}
  </div>
</div>

<style>
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

  .code-content {
    padding: 12px;
    overflow-x: auto;
  }

  .code-content :global(pre) {
    margin: 0;
    background: none !important;
    padding: 0 !important;
    display: inline;
  }

  .code-content :global(code) {
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    white-space: pre;
  }

  .cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: var(--accent);
    margin-left: 1px;
    animation: blink 1s step-end infinite;
    vertical-align: text-bottom;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>
