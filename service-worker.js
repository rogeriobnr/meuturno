'use strict';

// 1. VERSÃO ATUALIZADA
// Subi para v40 para garantir que todos recebam essa nova lógica de rede
const CACHE_NAME = 'meuturno-cache-v40';

// Tempo limite para esperar pela rede antes de desistir (em milissegundos)
const NETWORK_TIMEOUT_MS = 3000;

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  './fundo_apontamento.jpg',
  // Bibliotecas Locais
  './libs/tailwind.css',
  './libs/jspdf.js',
  './libs/firebase-app.js',
  './libs/firebase-firestore.js',
  './libs/xlsx.js',
  './libs/chart.js'
];

// -----------------------------------------------------------
// 1. INSTALAÇÃO
// -----------------------------------------------------------
self.addEventListener('install', event => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Fazendo cache dos arquivos estáticos');
      return cache.addAll(urlsToCache);
    })
  );
});

// -----------------------------------------------------------
// 2. ATIVAÇÃO (Limpeza de cache antigo)
// -----------------------------------------------------------
self.addEventListener('activate', event => {
  console.log('[SW] Ativando versão:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Apagando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// -----------------------------------------------------------
// 3. FETCH (Interceptação de rede com Timeout)
// -----------------------------------------------------------

// Função auxiliar de Timeout
function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout rede')), ms));
}

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Ignora requisições externas ou não-GET
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;
  
  // ESTRATÉGIA 1: HTML (Navegação) -> Network First com Timeout
  // Tenta rede por 3 segundos. Se falhar ou demorar, pega do cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(event.request), timeout(NETWORK_TIMEOUT_MS)])
        .then(response => {
            return response;
        })
        .catch(() => {
            // Se der erro de rede OU timeout, pega do cache
            return caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Se não tem no cache (primeiro acesso offline), retorna o index.html como fallback
                return caches.match('./index.html');
            });
        })
    );
    return;
  }
  
  // ESTRATÉGIA 2: Arquivos Estáticos (JS, CSS, Imagens) -> Cache First
  // Prioridade total para velocidade de carregamento
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// -----------------------------------------------------------
// 4. MENSAGERIA
// -----------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Ordem recebida: Pular espera e atualizar!');
    self.skipWaiting();
  }
});
