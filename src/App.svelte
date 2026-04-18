<script lang="ts">
  import Sidebar from './components/layout/Sidebar.svelte';
  import ChatArea from './components/layout/ChatArea.svelte';
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
