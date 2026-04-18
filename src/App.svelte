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
