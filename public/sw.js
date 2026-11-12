// Offline cache for the built game. Navigations are network-first so new deployments
// are picked up; other same-origin GET requests are cache-first.
// The Whisper model and ONNX Runtime WASM (under /models/) are cached on first use in
// MODEL_CACHE, which is not precached and survives app-cache version bumps.
const CACHE = 'ord-v2';
const MODEL_CACHE = 'ord-models-v1';
const KEEP_CACHES = [CACHE, MODEL_CACHE];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './manifest.webmanifest', './icons/icon-192.png'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function cacheFirst(request, cacheName) {
  return caches.match(request, { cacheName }).then(
    (cached) =>
      cached ||
      fetch(request).then((response) => {
        if (response.ok) {
          caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      }),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.includes('/models/')) {
    event.respondWith(cacheFirst(request, MODEL_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE).then((cache) => cache.put('./', response.clone()));
          return response;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  event.respondWith(cacheFirst(request, CACHE));
});
