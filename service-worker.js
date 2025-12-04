'use strict';
 
const CACHE_NAME = 'meuturno-cache-v16';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  './fundo_apontamento.jpg',
  
  // CDNs
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js', 
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js' 
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando...', CACHE_NAME);
  
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Ativando e limpando antigos...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[ServiceWorker] Apagando:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (requestUrl.origin.includes('firestore.googleapis.com') || 
      requestUrl.origin.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  if (!requestUrl.protocol.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        
        const fetchedResponsePromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
             // Offline: falha silenciosa
          });

        return cachedResponse || fetchedResponsePromise;
      });
    })
  );
});

// --- NOVO: Escuta o botão "Atualizar Agora" do popup ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
