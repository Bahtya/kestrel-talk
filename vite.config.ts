import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    open: true,
  },
  test: {
    exclude: ['browser-e2e/**', 'node_modules/**'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          shiki: ['shiki'],
          markdown: ['marked', 'isomorphic-dompurify'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
