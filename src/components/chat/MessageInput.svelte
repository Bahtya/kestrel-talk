<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import { exportChatAsMarkdown } from '../../lib/utils/export';
  import { showToast } from '../../lib/utils/storage';

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
    if (!text || text.length > MAX_LENGTH) return;

    if (text === '/clear') {
      chatStore.clearHistory();
      showToast('History cleared', 'success');
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
Ctrl+Shift+T — Toggle theme
Ctrl+/ — Show keyboard shortcuts
↑ / ↓ — Navigate input history
Enter — Send message
Shift+Enter — New line`);
      inputText = '';
      historyIndex = -1;
      resetHeight();
      return;
    }

    if (text === '/export') {
      exportChatAsMarkdown(chatStore.messages);
      showToast('Chat exported', 'success');
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
    textareaEl?.focus();
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

  const MAX_LENGTH = 4000;

  let disabled = $derived(chatStore.connectionState !== 'connected');
  let hasText = $derived(inputText.trim().length > 0);
  let charCount = $derived(inputText.length);
  let overLimit = $derived(charCount > MAX_LENGTH);
</script>

<div class="input-area">
  {#if chatStore.connectionState !== 'connected'}
    <div class="connection-banner" class:connecting={chatStore.connectionState === 'connecting'}>
      <span>
        {#if chatStore.connectionState === 'connecting'}
          Connecting...
        {:else if chatStore.reconnectAttempt > 0}
          Reconnecting... (attempt {chatStore.reconnectAttempt})
        {:else if chatStore.lastError}
          {chatStore.lastError}
        {:else}
          Waiting for connection...
        {/if}
      </span>
      {#if chatStore.connectionState === 'disconnected' || chatStore.connectionState === 'error'}
        <button class="reconnect-btn" onclick={() => chatStore.connect()}>Reconnect</button>
      {/if}
    </div>
  {/if}
  <div class="input-wrapper">
    <textarea
      bind:this={textareaEl}
      bind:value={inputText}
      oninput={autoResize}
      onkeydown={handleKeydown}
      placeholder="Message"
      aria-label="Message input"
      rows="1"
      {disabled}
    ></textarea>
    {#if hasText && !disabled && !overLimit}
      <button class="send-btn" onclick={send} aria-label="Send message">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
      </button>
    {/if}
  </div>
  {#if charCount > 200}
    <div class="char-counter" class:over-limit={overLimit}>{charCount} / {MAX_LENGTH}</div>
  {/if}
</div>

<style>
  .input-area {
    padding: 6px 0 8px;
    background: var(--bg-sidebar);
  }

  .connection-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 6px 12px;
    margin: 0 12px 6px;
    font-size: 13px;
    color: var(--text-secondary);
    background: var(--error-bg);
    border-radius: var(--radius-md);
  }

  .connection-banner.connecting {
    background: var(--warning-bg);
  }

  .reconnect-btn {
    background: var(--bg-overlay);
    border: 1px solid var(--border-light);
    color: var(--text-secondary);
    padding: 2px 10px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    cursor: pointer;
    transition: background var(--duration-fast);
  }

  .reconnect-btn:hover {
    background: var(--bg-overlay-hover);
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0;
    padding: 0 16px;
  }

  textarea {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 16px;
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

  .char-counter {
    text-align: right;
    font-size: 11px;
    color: var(--text-meta);
    padding: 0 20px 2px;
  }

  .char-counter.over-limit {
    color: var(--danger);
    font-weight: 600;
  }
</style>
