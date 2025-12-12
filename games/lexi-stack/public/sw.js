const CACHE_NAME = 'lexistack-v1';
const BASE = self.registration.scope; // includes trailing slash, e.g. https://example.com/lexistack/
const withBase = (path) => `${BASE}${path.replace(/^\//, '')}`;

const urlsToCache = [
  BASE,
  withBase('index.html'),
  withBase('logo.webp'),
  withBase('icon-192x192.png'),
  withBase('icon-512x512.png'),
  withBase('apple-touch-icon.png'),
  withBase('favicon-32x32.png'),
  withBase('favicon-16x16.png'),
  withBase('og-image.png'),
  withBase('og-image-facebook.png'),
  withBase('og-image-twitter.png'),
  withBase('og-image-square.png'),
  withBase('words.txt'),
  withBase('dictionary.json'),
  withBase('manifest.json')
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, return offline page if available
        if (event.request.destination === 'document') {
          return caches.match(withBase('index.html'));
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

