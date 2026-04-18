<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    children: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let hasError = $state(false);
  let errorMessage = $state('');

  onMount(() => {
    const handler = (event: ErrorEvent) => {
      hasError = true;
      errorMessage = event.error?.message ?? 'An unexpected error occurred';
      event.preventDefault();
    };
    window.addEventListener('error', handler);

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      hasError = true;
      errorMessage = event.reason?.message ?? 'An async error occurred';
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  });

  function reload() {
    location.reload();
  }
</script>

{#if hasError}
  <div class="error-boundary">
    <div class="error-content">
      <div class="error-icon">!</div>
      <h2>Something went wrong</h2>
      <p class="error-message">{errorMessage}</p>
      <button onclick={reload}>Reload</button>
    </div>
  </div>
{:else}
  {@render children()}
{/if}

<style>
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: var(--bg-chat);
  }

  .error-content {
    text-align: center;
    max-width: 320px;
    padding: 20px;
  }

  .error-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(229, 57, 53, 0.15);
    color: var(--danger);
    font-size: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .error-message {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 16px;
    word-break: break-word;
  }

  button {
    background: var(--accent);
    color: white;
    border: none;
    padding: 8px 24px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;
  }

  button:hover {
    background: var(--accent-hover);
  }
</style>
