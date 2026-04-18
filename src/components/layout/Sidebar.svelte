<script lang="ts">
  import ConnectionStatus from '../chat/ConnectionStatus.svelte';
  import ConnectionSettings from '../chat/ConnectionSettings.svelte';
  import { chatStore } from '../../lib/state/chat-store.svelte';
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <h1 class="sidebar-title">kestrel-talk</h1>
  </div>

  <nav class="session-list" aria-label="Chat sessions">
    <button class="session-item active" aria-current="true">
      <div class="session-avatar" aria-hidden="true">K</div>
      <div class="session-info">
        <div class="session-name">kestrel-agent</div>
        <div class="session-preview">
          {chatStore.connectionState === 'connected' ? 'online' : chatStore.connectionState}
        </div>
      </div>
    </button>
  </nav>

  <div class="sidebar-footer">
    <ConnectionSettings />
    <ConnectionStatus />
  </div>
</aside>

<style>
  .sidebar {
    width: 300px;
    min-width: 300px;
    height: 100%;
    background: var(--bg-sidebar);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
  }

  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .session-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    font: inherit;
    color: inherit;
  }

  .session-item:hover {
    background: var(--bg-hover);
  }

  .session-item.active {
    background: var(--bg-hover);
  }

  .session-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }

  .session-info {
    overflow: hidden;
  }

  .session-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-preview {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .sidebar-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
