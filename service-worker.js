const CACHE_NAME = 'meuturno-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/meuturno.js',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalando
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

// Ativando
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Interceptando requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
