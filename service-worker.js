'use strict';

// 1. INCREMENTE A VERSÃO
const CACHE_NAME = 'meuturno-cache-v8.4';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  // 2. MELHORIA: Garante que a imagem do PDF funcione sem internet
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Adiciona todos os arquivos críticos
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

  // 3. MELHORIA: Filtros de Segurança
  // Ignora métodos que não sejam GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições do próprio Firebase/Firestore/Google APIs
  // (Deixe o SDK do Firebase lidar com o cache de dados, evita conflitos)
  if (requestUrl.origin.includes('firestore.googleapis.com') || 
      requestUrl.origin.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // Ignora extensões do Chrome e esquemas não-http
  if (!requestUrl.protocol.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        
        // Estratégia: Stale-While-Revalidate
        // 1. Busca na rede para atualizar o cache em background
        const fetchedResponsePromise = fetch(event.request)
          .then(networkResponse => {
            // Só guarda no cache se a resposta for válida (status 200)
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            // 4. MELHORIA: Se der erro na rede (offline), apenas ignora.
            // O app vai continuar funcionando se tiver o arquivo em cache.
            // console.warn('Fetch falhou (offline):', event.request.url);
          });

        // 2. Se tem no cache, entrega IMEDIATAMENTE (rápido).
        // Se não tem, espera a rede.
        return cachedResponse || fetchedResponsePromise;
      });
    })
  );
});