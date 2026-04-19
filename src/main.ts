import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { initTheme } from './lib/utils/theme';

initTheme();
const target = document.getElementById('app');
if (!target) throw new Error('Root element #app not found');
const app = mount(App, { target });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

export default app;
