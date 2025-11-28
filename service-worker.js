'use strict';

// Versão do cache. Altere este valor sempre que atualizar os arquivos do app.
const CACHE_NAME = 'meuturno-cache-v8.2'; // Versão Incrementada

// Arquivos essenciais da aplicação (App Shell), incluindo os de CDN.
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  // CDNs para performance offline (AGORA INCLUI FIREBASE E SHEETJS)
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js', 
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js' 
];

// Instala o Service Worker e guarda os arquivos do App Shell no cache.
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando nova versão...');
  self.skipWaiting(); // Força a ativação imediata do novo Service Worker.
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Arquivos essenciais guardados no cache.');
      return cache.addAll(urlsToCache);
    })
  );
});

// Ativa o Service Worker e limpa os caches antigos para evitar conflitos.
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Ativando e limpando caches antigos...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o nome do cache não estiver na lista de permissões, apaga-o.
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[ServiceWorker] A apagar cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma controlo imediato das páginas abertas.
  );
});

// Intercepta os pedidos de rede e aplica a estratégia "Stale-While-Revalidate".
self.addEventListener('fetch', event => {
  // Ignora pedidos que não são GET (ex: POST, PUT)
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // 1. Tenta ir à rede buscar a versão mais recente.
        const fetchedResponsePromise = fetch(event.request).then(networkResponse => {
          // Se a resposta da rede for válida, guarda-a no cache para a próxima vez.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // 2. Retorna a resposta do cache (se existir) imediatamente,
        // ou espera pela resposta da rede se não houver nada no cache.
        return cachedResponse || fetchedResponsePromise;
      });
    })
  );
});
