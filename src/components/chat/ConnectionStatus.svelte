<script lang="ts">
  import { chatStore } from '../../lib/state/chat-store.svelte';

  const labels: Record<string, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Connection Error',
  };

  const colors: Record<string, string> = {
    disconnected: '#6c7883',
    connecting: '#f9a825',
    connected: '#4caf50',
    error: '#e53935',
  };
</script>

<div class="connection-status">
  <span class="status-dot" style="background: {colors[chatStore.connectionState]}"></span>
  <span class="status-text">{labels[chatStore.connectionState]}</span>
</div>

<style>
  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-text {
    font-size: 13px;
    color: var(--text-secondary);
  }
</style>
