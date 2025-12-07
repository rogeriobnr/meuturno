'use strict';

// 1. VERSÃO ATUALIZADA (V27-FIX)
// A mudança do nome força o navegador a reinstalar o Service Worker e limpar o cache antigo
const CACHE_NAME = 'meuturno-cache-v29.1';

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

// 2. INSTALAÇÃO
self.addEventListener('install', event => {
  console.log('[SW] A instalar versão:', CACHE_NAME);
  
  // AQUI ESTÁ A CORREÇÃO CRÍTICA:
  // Força este SW a pular a fase de espera ("waiting"). Isso garante que a correção
  // entre em vigor imediatamente, sem esperar o utilizador fechar todas as abas.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] A criar cache dos ficheiros essenciais');
      return cache.addAll(urlsToCache);
    })
  );
});

// 3. ATIVAÇÃO E LIMPEZA
self.addEventListener('activate', event => {
  console.log('[SW] A ativar versão:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Faxina: a remover cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Força o SW a assumir o controlo de todas as abas abertas imediatamente
      console.log('[SW] Controlando clientes agora.');
      return self.clients.claim();
    })
  );
});

// 4. INTERCEPTAÇÃO DE REDE (FETCH)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Ignora requisições não-GET ou externas (Firebase/Google)
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;
  
  // ESTRATÉGIA PARA HTML (Navegação): Network First, Fallback to Cache
  // Tenta pegar a versão mais nova na rede. Se falhar (offline), usa o cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) return response;
            // Opcional: Se não tiver nem no cache, retornar uma página offline.html personalizada
          });
      })
    );
    return;
  }
  
  // ESTRATÉGIA PARA ARQUIVOS (JS, CSS, IMG): Cache First, Fallback to Network
  // Prioriza velocidade e funcionamento offline. Se não tiver no cache, busca na rede.
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 5. MENSAGENS (Para o botão de "Atualizar Agora" na interface)
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});