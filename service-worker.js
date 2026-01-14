'use strict';

// 1. VERSÃO E CONFIGURAÇÃO
// INCREMENTEI PARA FORÇAR A ATUALIZAÇÃO NOS CELULARES
const CACHE_NAME = 'meuturno-app-v3.1.6';

// Tempo limite (3s) para tentar rede antes de desistir e mostrar o cache
const NETWORK_TIMEOUT_MS = 3000;

// IMPORTANTE: Use ponto-barra (./) para garantir que funcione em qualquer pasta
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets.js', // <--- SUA IMAGEM BASE64 ESTÁ AQUI
  './libs/tailwind.css',
  './libs/jspdf.js',
  './libs/firebase-app.js',
  './libs/firebase-firestore.js',
  './libs/xlsx.js',
  './libs/chart.js'
  // Adicione seus ícones aqui se tiver (ex: './icon-192.png')
];

// -----------------------------------------------------------
// 2. INSTALAÇÃO
// -----------------------------------------------------------
self.addEventListener('install', event => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  
  // NOTA: NÃO usamos skipWaiting() aqui.
  // O novo SW espera o usuário clicar em "Atualizar Agora" no modal.
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando arquivos vitais...');
      return cache.addAll(urlsToCache);
    })
  );
});

// -----------------------------------------------------------
// 3. ATIVAÇÃO (Limpeza de cache antigo)
// -----------------------------------------------------------
self.addEventListener('activate', event => {
  console.log('[SW] Ativando versão:', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Faxina: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assume o controle imediatamente após a ativação (pós-clique do usuário)
      return self.clients.claim();
    })
  );
});

// -----------------------------------------------------------
// 4. FETCH (Interceptação Inteligente)
// -----------------------------------------------------------

// Função de Timeout para não deixar o usuário esperando na tela branca
function timeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout rede')), ms)
    );
}

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // A. Ignora o que não é GET ou é externo (Google/Firebase)
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;
  
  // B. ESTRATÉGIA 1: HTML (Navegação) -> Network First com Timeout
  // Evita a tela branca tentando baixar o HTML por 3s. Se falhar, usa o cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(event.request), timeout(NETWORK_TIMEOUT_MS)])
        .then(response => {
            return response; // Rede funcionou rápido
        })
        .catch(() => {
            console.log('[SW] Offline ou lento. Servindo App do Cache.');
            return caches.match('./index.html') // Tenta com ./
                .then(response => response || caches.match('/index.html')) // Tenta com /
                .then(response => response || caches.match(event.request)); // Tenta original
        })
    );
    return;
  }
  
  // C. ESTRATÉGIA 2: Assets (JS, CSS, Imagens) -> Cache First (Rápido!)
  // Isso garante que o seu assets.js (imagem) carregue instantaneamente
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// -----------------------------------------------------------
// 5. MENSAGERIA (Botão Atualizar)
// -----------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Atualização autorizada pelo usuário. Trocando versão...');
    self.skipWaiting();
  }
});
