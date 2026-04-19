<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();
  let query = $state('');
  let currentIndex = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();

  let matches = $derived.by(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: { messageId: string; blockIndex: number }[] = [];
    for (const msg of chatStore.messages) {
      for (let i = 0; i < msg.blocks.length; i++) {
        if (msg.blocks[i].content.toLowerCase().includes(q)) {
          results.push({ messageId: msg.id, blockIndex: i });
        }
      }
      if (msg.blocks.length === 0 && msg.content.toLowerCase().includes(q)) {
        results.push({ messageId: msg.id, blockIndex: -1 });
      }
    }
    return results;
  });

  let matchText = $derived(
    matches.length > 0 ? `${currentIndex + 1} / ${matches.length}` : query ? 'No results' : ''
  );

  function next() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex + 1) % matches.length;
    scrollToMatch();
  }

  function prev() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    scrollToMatch();
  }

  function scrollToMatch() {
    const match = matches[currentIndex];
    if (!match) return;
    // Remove previous highlight
    document.querySelectorAll('.search-highlight-active').forEach((el) => {
      el.classList.remove('search-highlight-active');
    });
    const el = document.querySelector(`[data-message-id="${match.messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('search-highlight-active');
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onclose();
    } else if (e.key === 'Enter') {
      e.shiftKey ? prev() : next();
    }
  }

  $effect(() => {
    query;
    currentIndex = 0;
  });

  $effect(() => {
    inputEl?.focus();
  });
</script>

<div class="search-bar" role="search">
  <input
    bind:this={inputEl}
    bind:value={query}
    onkeydown={handleKeydown}
    placeholder="Search messages..."
    type="search"
  />
  <span class="match-count">{matchText}</span>
  <button class="nav-btn" onclick={prev} disabled={matches.length === 0} aria-label="Previous match">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
  </button>
  <button class="nav-btn" onclick={next} disabled={matches.length === 0} aria-label="Next match">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
  </button>
  <button class="close-btn" onclick={onclose} aria-label="Close search">&times;</button>
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--bg-sidebar);
    border-bottom: 1px solid var(--border);
  }

  input {
    flex: 1;
    background: var(--bg-chat);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 4px 10px;
    font-size: 13px;
    font-family: var(--font-sans);
    outline: none;
    min-width: 0;
  }

  input:focus {
    border-color: var(--accent);
  }

  input::placeholder {
    color: var(--text-meta);
  }

  .match-count {
    font-size: 12px;
    color: var(--text-meta);
    white-space: nowrap;
    min-width: 60px;
    text-align: center;
  }

  .nav-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }

  .nav-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 18px;
    padding: 0 4px;
    border-radius: 4px;
    line-height: 1;
  }

  .close-btn:hover {
    background: var(--bg-hover);
  }

  :global(.search-highlight-active) {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
    border-radius: var(--radius-bubble);
    transition: outline-color 0.3s;
    animation: highlight-pulse 2s ease-out;
  }

  @keyframes highlight-pulse {
    0% { outline-color: var(--accent); }
    100% { outline-color: transparent; }
  }
</style>
