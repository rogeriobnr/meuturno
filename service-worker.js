'use strict';

// 1. VERSÃO E CONFIGURAÇÃO
// Incremento a versão para v59 para forçar o ciclo de update no navegador
const CACHE_NAME = 'meuturno-cache-v59';

// Tempo limite para esperar pela rede em navegações (3 segundos)
const NETWORK_TIMEOUT_MS = 3000;

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/assets.js',
  '/libs/tailwind.css',
  '/libs/jspdf.js',
  '/libs/firebase-app.js',
  '/libs/firebase-firestore.js',
  '/libs/xlsx.js',
  '/libs/chart.js'
];

// -----------------------------------------------------------
// 2. INSTALAÇÃO
// -----------------------------------------------------------
self.addEventListener('install', event => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  
  // O "skipWaiting" foi REMOVIDO daqui intencionalmente.
  // O SW vai instalar e ficar em estado de "waiting" até o usuário autorizar.
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Fazendo cache dos arquivos estáticos');
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
          // Apaga qualquer cache que não seja o da versão atual (v51)
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Faxina: Apagando cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assim que ativado, assume o controle das abas imediatamente
      // (Isso só acontece DEPOIS que o skipWaiting for chamado no passo 5)
      return self.clients.claim();
    })
  );
});

// -----------------------------------------------------------
// 4. FETCH (Interceptação de rede)
// -----------------------------------------------------------

// Função auxiliar de Timeout para não travar a tela branca se a rede estiver lenta
function timeout(ms) {
    return new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout rede')), ms)
    );
}

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // A. Ignora requisições que não devem ser cacheadas (APIs externas, POSTs, etc)
  if (event.request.method !== 'GET') return;
  if (requestUrl.origin.includes('googleapis.com') || requestUrl.origin.includes('firebase')) return;
  
  // B. ESTRATÉGIA 1: HTML (Navegação) -> Network First com Timeout
  // Tenta pegar o HTML fresco da rede. Se demorar > 3s ou falhar, pega do cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(event.request), timeout(NETWORK_TIMEOUT_MS)])
        .then(response => {
            return response; // Rede respondeu rápido
        })
        .catch(() => {
            // Se der erro de rede, timeout ou estiver offline:
            console.log('[SW] Rede lenta/offline. Servindo HTML do cache.');
            return caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Fallback final: Garante que o index.html seja entregue
                return caches.match('/index.html');
            });
        })
    );
    return;
  }
  
  // C. ESTRATÉGIA 2: Arquivos Estáticos (JS, CSS, Imagens) -> Cache First
  // Prioriza velocidade máxima. Só vai na rede se não tiver no cache.
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna cache se existir, senão busca na rede
      return response || fetch(event.request);
    })
  );
});

// -----------------------------------------------------------
// 5. MENSAGERIA (O Segredo do Update Seguro)
// -----------------------------------------------------------
// Escuta a mensagem enviada pelo botão "Atualizar Agora" do modal
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('[SW] Ordem do usuário recebida: Pular espera e assumir controle!');
    self.skipWaiting();
  }
});
