<script lang="ts">
  interface Props {
    src: string;
    caption?: string;
  }

  let { src, caption = '' }: Props = $props();
  let loaded = $state(false);
  let error = $state(false);
</script>

<div class="image-block">
  {#if error}
    <div class="image-error">
      <span>Failed to load image</span>
    </div>
  {:else}
    <img
      src={src}
      alt={caption}
      onload={() => { loaded = true; }}
      onerror={() => { error = true; }}
      class:loading={!loaded}
    />
    {#if !loaded && !error}
      <div class="image-placeholder">
        <div class="spinner"></div>
      </div>
    {/if}
    {#if caption}
      <div class="image-caption">{caption}</div>
    {/if}
  {/if}
</div>

<style>
  .image-block {
    margin: 8px 0;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--bg-code);
    position: relative;
  }

  img {
    max-width: 100%;
    max-height: 400px;
    display: block;
    transition: opacity 0.3s;
  }

  img.loading {
    opacity: 0;
    position: absolute;
  }

  .image-placeholder {
    width: 200px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--text-meta);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .image-caption {
    padding: 6px 12px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .image-error {
    padding: 16px;
    text-align: center;
    color: var(--text-meta);
    font-size: 13px;
  }
</style>
