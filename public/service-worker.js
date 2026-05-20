// CapyUNI IDE Service Worker
// Keep this worker conservative: Vite emits hashed JS chunks, so caching
// index.html or module scripts can break lazy imports after each deploy.
const CACHE_NAME = 'capyuni-runtime-cache-v3';
const LEGACY_CACHE_PREFIX = 'capyuni-cache';
const STATIC_ASSETS = [
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME || key.startsWith(LEGACY_CACHE_PREFIX))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const shouldAlwaysUseNetwork = (request) => {
  const url = new URL(request.url);

  if (request.mode === 'navigate') return true;
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) return true;
  if (url.pathname.startsWith('/assets/')) return true;
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'worker') return true;

  return false;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (shouldAlwaysUseNetwork(request)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        const url = new URL(request.url);

        if (STATIC_ASSETS.includes(url.pathname) && networkResponse.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }

        return networkResponse;
      });
    })
  );
});
