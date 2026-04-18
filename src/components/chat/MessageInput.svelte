<script lang="ts">
  interface Props {
    onsend: (text: string) => void;
  }

  let { onsend }: Props = $props();
  let inputText = $state('');

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function send() {
    const text = inputText.trim();
    if (!text) return;
    onsend(text);
    inputText = '';
  }
</script>

<div class="input-area">
  <div class="input-wrapper">
    <textarea
      bind:value={inputText}
      onkeydown={handleKeydown}
      placeholder="Type a message..."
      rows="1"
    ></textarea>
    <button class="send-btn" onclick={send} disabled={!inputText.trim()} aria-label="Send message">
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
