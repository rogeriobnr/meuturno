const CACHE_NAME = 'meuturno-cache-v6.32';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando nova versão...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Ativando e limpando caches antigos...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[ServiceWorker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
