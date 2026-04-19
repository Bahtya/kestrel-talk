const CACHE = 'kestrel-talk-v5';
const PRECACHE = ['/', '/index.html', '/favicon.svg', '/favicon.ico', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip WebSocket and non-same-origin
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.origin !== self.location.origin) return;

  // Network-first for navigation, cache-first for assets
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>kestrel-talk — Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0e1621;color:#f5f5f5}div{text-align:center}h1{font-size:20px;margin:0 0 8px}p{color:#8b9bab;font-size:14px}</style></head><body><div><h1>You\'re offline</h1><p>Check your connection and try again.</p></div></body></html>', { status: 503, headers: { 'Content-Type': 'text/html' } }));
      return cached || fetched;
    })
  );
});
