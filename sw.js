const CACHE = 'streamfinder-v1';
const SHELL = [
  '/webapp/',
  '/webapp/index.html',
  '/webapp/manifest.json',
  '/webapp/icons/icon-192.png',
  '/webapp/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for TMDB API calls, cache-first for app shell
  if (e.request.url.includes('api.themoviedb.org') || e.request.url.includes('image.tmdb.org')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
