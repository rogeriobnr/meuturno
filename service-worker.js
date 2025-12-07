'use strict';

// 1. VERSÃO ATUALIZADA (V27-FIX)
// A mudança do nome força o navegador a reinstalar o Service Worker e limpar o cache antigo
const CACHE_NAME = 'meuturno-cache-v39';

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
  
  // NOTA: NÃO usamos self.skipWaiting() aqui.
  // Isso é crucial para que a atualização fique em "espera" 
  // e o seu Modal/Popup apareça para o usuário.
  
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
      // Assim que ativado, controla as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// -----------------------------------------------------------
// 3. FETCH (Interceptação de rede)
// -----------------------------------------------------------
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Ignora requisições que não sejam GET ou sejam externas (Google/Firebase)
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;
  
  // ESTRATÉGIA 1: HTML (Navegação) -> Network First
  // Tenta pegar a versão mais recente na rede. Se falhar (offline), pega do cache.
  // Isso ajuda a detectar atualizações do index.html mais rápido.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // ESTRATÉGIA 2: Arquivos Estáticos (JS, CSS, Imagens) -> Cache First
  // Tenta pegar do cache. Se não tiver, baixa da rede.
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// -----------------------------------------------------------
// 4. MENSAGERIA (O Segredo do Botão "Atualizar")
// -----------------------------------------------------------
// Este trecho espera a ordem vinda do seu index.html quando o usuário clica no botão
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Ordem recebida: Pular espera e atualizar!');
    self.skipWaiting();
  }
});