// Bump on breaking cache changes. User data lives in localStorage/IndexedDB and is never touched here.
const CACHE_NAME = 'my-memory-v3';
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

// Caches from service workers that predate the in-app "Update" prompt.
const LEGACY_CACHES = ['my-memory-v1', 'my-memory-v2'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await (await caches.open(CACHE_NAME)).addAll(APP_SHELL);
    // Normally the app asks the user before switching versions. Pages served by the legacy worker
    // can't show that prompt, so take over immediately once to get them off the stale version.
    const legacy = await Promise.all(LEGACY_CACHES.map((name) => caches.has(name)));
    if (legacy.some(Boolean)) await self.skipWaiting();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

const putInCache = (request, response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Pages: network first so deploys show up; cached app shell when offline (SPA routes all serve index.html).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache('/', response))
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed build assets never change: cache first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((res) => putInCache(request, res))));
    return;
  }

  // Everything else: network, falling back to cache.
  event.respondWith(fetch(request).then((res) => putInCache(request, res)).catch(() => caches.match(request)));
});
