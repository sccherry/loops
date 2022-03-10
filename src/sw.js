/**
 * Globals
 */

const CACHE_NAME = 'v1';

/**
 * Utility functions
 */

function shouldHandleFetch(request) {
  const url = new URL(request.url);

  const criteria = [
    // Is GET request
    request.method === 'GET',
    // Request is to the same origin
    url.origin === self.location.origin,
  ];

  return criteria.reduce((prev, curr) => prev && curr);
}

/**
 * Install event
 */

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([
          './public/img/apple-touch-icon.png',
          './public/img/favicon.ico',
          './public/img/icon-192.png',
          './public/img/icon-512.png',
          './public/img/icon.svg',
          './public/script.js',
          './public/style.css',
          './index.html',
          './',
        ])
      )
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event
 */

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event
 */

self.addEventListener('fetch', (e) => {
  if (!shouldHandleFetch(e.request)) {
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return caches.match(e.request).then((cachedResponse) => {
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          cache.put(e.request, networkResponse.clone());

          return networkResponse;
        });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});
