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
</script>

<div class="input-area">
  {#if chatStore.connectionState === 'disconnected' || chatStore.connectionState === 'error'}
    <div class="connection-banner">
      <span class="banner-dot"></span>
      {chatStore.connectionState === 'error' ? 'Connection failed. Reconnecting...' : 'Connecting to kestrel-agent...'}
    </div>
  {/if}
  <div class="input-wrapper">
    <textarea
      bind:this={textareaEl}
      bind:value={inputText}
      oninput={autoResize}
      onkeydown={handleKeydown}
      placeholder={disabled ? 'Waiting for connection...' : 'Type a message... (↑ for history)'}
      rows="1"
      {disabled}
    ></textarea>
    <button class="send-btn" onclick={send} disabled={!inputText.trim() || disabled} aria-label="Send message">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  </div>
</div>

<style>
  .input-area {
    padding: 8px 20px 12px;
    background: var(--bg-chat);
  }

  .connection-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--text-secondary);
    background: rgba(229, 57, 53, 0.1);
    border-radius: var(--radius-sm);
  }

  .banner-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--danger);
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: var(--bg-input);
    border-radius: var(--radius-lg);
    padding: 6px 8px 6px 16px;
  }

  textarea {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.5;
    resize: none;
    max-height: 150px;
    min-height: 24px;
    padding: 6px 0;
  }

  textarea::placeholder {
    color: var(--text-meta);
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .send-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, opacity 0.15s;
  }

  .send-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
