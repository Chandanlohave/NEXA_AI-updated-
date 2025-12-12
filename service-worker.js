const CACHE_NAME = 'nexa-cache-v6'; // Important: New version name
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: Open cache and add core files (the "app shell")
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW Opened cache. Caching app shell...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Force the new service worker to become active
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('SW Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all open clients
});

// Fetch: Serve from cache first, then network. Cache new requests dynamically.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Strategy: Cache first, then fall back to network.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response and it's not an API call
            if (!networkResponse || networkResponse.status !== 200 || event.request.url.includes('generativelanguage')) {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          // Optional: You can return a custom offline page here if available.
          console.log('Fetch failed; returning offline page if available.');
        });
      })
  );
});