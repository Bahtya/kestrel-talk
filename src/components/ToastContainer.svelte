<script lang="ts">
  import { onMount } from 'svelte';
  import { getToasts, subscribeToasts } from '../lib/utils/storage';

  let toasts = $state(getToasts());

  onMount(() => {
    return subscribeToasts((t) => { toasts = t; });
  });
</script>

<div class="toast-container" role="status" aria-live="polite" aria-atomic="false">
  {#each toasts as toast (toast.id)}
    <div class="toast" class:error={toast.type === 'error'} class:success={toast.type === 'success'}>
      {toast.message}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-toast);
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    background: var(--bg-sidebar);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border);
    animation: toast-in 0.2s ease-out;
    white-space: nowrap;
  }

  .toast.success {
    border-color: rgba(76, 175, 80, 0.4);
  }

  .toast.error {
    border-color: rgba(229, 57, 53, 0.4);
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
