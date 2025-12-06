'use strict';

// Mude a versão para forçar a atualização nos clientes
const CACHE_NAME = 'meuturno-cache-v27';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  './fundo_apontamento.jpg',
// Arquivos Locais
'./libs/tailwind.css',
'./libs/jspdf.js',
'./libs/firebase-app.js',
'./libs/firebase-firestore.js',
'./libs/xlsx.js',
'./libs/chart.js'
];

// 1. INSTALAÇÃO: Apenas baixa os arquivos para o cache novo
self.addEventListener('install', event => {
  console.log('[SW] Baixando nova versão:', CACHE_NAME);
  
  // REMOVIDO: self.skipWaiting() -> Isso impede o reload automático!
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching files');
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. ATIVAÇÃO: Limpa caches antigos quando a nova versão assume
self.addEventListener('activate', event => {
  console.log('[SW] Ativando versão:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Apagando cache velho:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Estratégia NetworkFirst para HTML, CacheFirst para o resto
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;

  // HTML: Tenta rede para ver se tem update, senão cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets: Cache primeiro, rede depois
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// 4. ESCUTA A ORDEM DO BOTÃO "ATUALIZAR AGORA"
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting(); // AQUI acontece a mágica quando o usuário clica
  }
});
