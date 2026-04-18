<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    content: string;
    language?: string | null;
    done?: boolean;
  }

  let { content, language = null, done = false }: Props = $props();

  let highlighted = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let shikiReady = $state(false);

  onMount(async () => {
    try {
      await import('shiki');
      shikiReady = true;
    } catch {
      // shiki not available, use plain text
    }
  });

  $effect(() => {
    const c = content;
    const d = done;

    if (!shikiReady) return;

    if (d) {
      // Final highlight - do it immediately
      debounceTimer && clearTimeout(debounceTimer);
      highlightCode(c, language ?? 'text').then((h) => { highlighted = h; });
    } else {
      // Debounced highlight during streaming
      debounceTimer && clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        highlightCode(c, language ?? 'text').then((h) => { highlighted = h; });
      }, 150);
    }

    return () => {
      debounceTimer && clearTimeout(debounceTimer);
    };
  });

  async function highlightCode(code: string, lang: string): Promise<string> {
    try {
      const shiki = await import('shiki');
      const highlighter = await shiki.createHighlighter({
        themes: ['vitesse-dark'],
        langs: [lang || 'text'],
      });
      const html = highlighter.codeToHtml(code, {
        lang: lang || 'text',
        theme: 'vitesse-dark',
      });
      highlighter.dispose();
      return html;
    } catch {
      return '';
    }
  }

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
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
