<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';

  interface Props {
    onsend: (text: string) => void;
  }

  let { onsend }: Props = $props();
  let inputText = $state('');
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  let inputHistory: string[] = $state([]);
  let historyIndex = -1;

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if (e.key === 'ArrowUp' && inputText === '' && inputHistory.length > 0) {
      e.preventDefault();
      historyIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
      inputText = inputHistory[historyIndex];
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
      e.preventDefault();
      historyIndex = Math.max(historyIndex - 1, -1);
      inputText = historyIndex >= 0 ? inputHistory[historyIndex] : '';
    }
  }

  function send() {
    const text = inputText.trim();
    if (!text) return;

    if (text === '/clear') {
      chatStore.clearHistory();
      inputText = '';
      historyIndex = -1;
      resetHeight();
      return;
    }

    if (text === '/help') {
      chatStore.addSystemMessage(`**Available commands:**
/clear — Clear chat history
/help — Show this help message
/export — Export chat as markdown
/search or Ctrl+F — Search messages
↑ / ↓ — Navigate input history
Enter — Send message
Shift+Enter — New line`);
      inputText = '';
      historyIndex = -1;
      resetHeight();
      return;
    }

    inputHistory = [text, ...inputHistory].slice(0, 50);
    historyIndex = -1;
    onsend(text);
    inputText = '';
    resetHeight();
  }

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = Math.min(textareaEl.scrollHeight, 150) + 'px';
  }

  function resetHeight() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
  }

  let disabled = $derived(chatStore.connectionState !== 'connected');
  let hasText = $derived(inputText.trim().length > 0);
</script>

<div class="input-area">
  {#if chatStore.connectionState === 'disconnected' || chatStore.connectionState === 'error'}
    <div class="connection-banner">
      {chatStore.connectionState === 'error' ? 'Connection failed. Reconnecting...' : 'Waiting for connection...'}
    </div>
  {/if}
  <div class="input-wrapper">
    <button class="attach-btn" aria-label="Attach file" disabled>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" /></svg>
    </button>
    <textarea
      bind:this={textareaEl}
      bind:value={inputText}
      oninput={autoResize}
      onkeydown={handleKeydown}
      placeholder="Message"
      rows="1"
      {disabled}
    ></textarea>
    {#if hasText && !disabled}
      <button class="send-btn" onclick={send} aria-label="Send message">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
      </button>
    {:else}
      <button class="mic-btn" disabled aria-label="Voice message">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" /></svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .input-area {
    padding: 6px 0 8px;
    background: var(--bg-sidebar);
  }

  .connection-banner {
    text-align: center;
    padding: 6px 12px;
    margin: 0 12px 6px;
    font-size: 13px;
    color: var(--text-secondary);
    background: rgba(229, 57, 53, 0.08);
    border-radius: var(--radius-md);
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0;
    padding: 0 6px;
  }

  .attach-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 10px;
    border-radius: 50%;
    display: flex;
    transition: background var(--duration-fast), color var(--duration-fast);
    flex-shrink: 0;
  }

  .attach-btn:hover:not(:disabled) {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .attach-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.4;
    resize: none;
    max-height: 150px;
    min-height: 40px;
    padding: 10px 0;
  }

  textarea::placeholder {
    color: var(--text-meta);
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .send-btn {
    background: var(--accent);
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--duration-fast), transform var(--duration-fast);
  }

  .send-btn:hover {
    background: var(--accent-hover);
  }

  .send-btn:active {
    transform: scale(0.92);
  }

  .mic-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background var(--duration-fast);
  }

  .mic-btn:hover:not(:disabled) {
    background: var(--bg-hover);
  }

  .mic-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>
