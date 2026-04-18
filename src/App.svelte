<script lang="ts">
  import { onMount } from 'svelte';
  import ErrorBoundary from './components/ErrorBoundary.svelte';
  import Sidebar from './components/layout/Sidebar.svelte';
  import ChatArea from './components/layout/ChatArea.svelte';
  import { chatStore } from './lib/state/chat-store.svelte';
  import { initNotifications } from './lib/utils/browser-notify';

  onMount(() => {
    chatStore.connect();
    initNotifications();
  });
</script>

<ErrorBoundary>
  <a href="#chat-messages" class="skip-link">Skip to chat</a>
  <div class="app-layout">
    <Sidebar />
    <ChatArea />
  </div>
</ErrorBoundary>

<style>
  .skip-link {
    position: absolute;
    top: -100%;
    left: 0;
    background: var(--accent);
    color: white;
    padding: 8px 16px;
    z-index: 100;
    font-size: 14px;
    border-radius: 0 0 var(--radius-sm) 0;
    text-decoration: none;
  }

  .skip-link:focus {
    top: 0;
  }

  .app-layout {
    display: flex;
    height: 100%;
    width: 100%;
  }

  @media (max-width: 768px) {
    .app-layout {
      position: relative;
    }

    .app-layout > :global(aside) {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 10;
      width: 280px;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
    }
  }
</style>
