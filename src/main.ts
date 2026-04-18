import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { initTheme } from './lib/utils/theme';

initTheme();
const app = mount(App, { target: document.getElementById('app')! });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

export default app;
