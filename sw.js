/* Service worker: precaches the whole app so it works fully offline. */
// Set by .github/workflows/update-moment-timezone.yml, so new timezone data gets a fresh cache
const TZ_VERSION = '0.6.5';
const CACHE_NAME = 'timezone-converter-v2-tz' + TZ_VERSION;

const PRECACHE_URLS = [
  './',
  'index.html',
  'meeting-planner.html',
  'favicon.ico',
  'manifest.webmanifest',
  'libs/jquery-1.11.3.min.js',
  'libs/select2.min.js',
  'libs/select2.min.css',
  'libs/moment.min.js',
  'libs/moment-timezone-with-data.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Bypass the HTTP cache so an update never re-caches stale files
      .then((cache) => cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
