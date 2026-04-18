<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';
  import { saveSetting, loadSetting } from '../../lib/utils/storage';

  let wsUrl = $state(loadSetting('wsUrl', 'ws://127.0.0.1:8090'));
  let authToken = $state(loadSetting('authToken', ''));
  let showSettings = $state(false);

  function save() {
    saveSetting('wsUrl', wsUrl);
    saveSetting('authToken', authToken);
    showSettings = false;
    chatStore.disconnect();
    chatStore.updateConnection(wsUrl, authToken || undefined);
    chatStore.connect();
  }
</script>

<div class="settings-section">
  <button class="settings-toggle" onclick={() => { showSettings = !showSettings; }} aria-label="Connection settings">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  </button>

  {#if showSettings}
    <div class="settings-panel">
      <div class="settings-header">
        <span>Connection Settings</span>
        <button class="close-btn" onclick={() => { showSettings = false; }} aria-label="Close settings">&times;</button>
      </div>

      <label class="field">
        <span class="label">WebSocket URL</span>
        <input type="text" bind:value={wsUrl} placeholder="ws://127.0.0.1:8090" />
      </label>

      <label class="field">
        <span class="label">Auth Token (optional)</span>
        <input type="password" bind:value={authToken} placeholder="Leave empty if no auth" />
      </label>

      <div class="settings-actions">
        <button class="save-btn" onclick={save}>Save & Reconnect</button>
        <button class="clear-btn" onclick={() => { chatStore.clearHistory(); }}>Clear History</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-section {
    position: relative;
  }

  .settings-toggle {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.15s, color 0.15s;
  }

  .settings-toggle:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .settings-panel {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: var(--bg-sidebar);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px;
    margin-bottom: 8px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 18px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .close-btn:hover {
    background: var(--bg-hover);
  }

  .field {
    display: block;
    margin-bottom: 10px;
  }

  .label {
    display: block;
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  input {
    width: 100%;
    background: var(--bg-chat);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 6px 10px;
    font-size: 13px;
    font-family: var(--font-mono);
    outline: none;
  }

  input:focus {
    border-color: var(--accent);
  }

  .settings-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .save-btn {
    flex: 1;
    background: var(--accent);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }

  .save-btn:hover {
    background: var(--accent-hover);
  }

  .clear-btn {
    background: none;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }

  .clear-btn:hover {
    background: var(--bg-hover);
  }
</style>
