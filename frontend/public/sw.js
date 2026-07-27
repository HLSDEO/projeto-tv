const CACHE_NAME = 'tvdlog-media-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept requests for static uploads
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
            // Only cache complete 200 OK responses to avoid partial cache corruption
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
          }
          return networkResponse;
        } catch (err) {
          console.warn('ServiceWorker media fetch fallback:', event.request.url, err);
          return fetch(event.request);
        }
      })
    );
  }
});

// Selective cleanup event listener: removes cached files no longer in active media list
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_UNUSED_CACHE') {
    const activePaths = new Set(event.data.activePaths || []);
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((req) => {
          const reqPath = new URL(req.url).pathname;
          if (!activePaths.has(reqPath)) {
            cache.delete(req);
          }
        });
      });
    });
  }
});
