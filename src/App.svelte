<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './components/layout/Sidebar.svelte';
  import ChatArea from './components/layout/ChatArea.svelte';
  import { chatStore } from './lib/state/chat-store.svelte';

  onMount(() => {
    chatStore.connect();
  });
</script>

<div class="app-layout">
  <Sidebar />
  <ChatArea />
</div>

<style>
  .app-layout {
    display: flex;
    height: 100%;
    width: 100%;
  }
</style>
