'use strict';

// Mude este número SEMPRE que editar qualquer arquivo no projeto
const CACHE_NAME = 'meuturno-cache-v19';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png', 
  './icon-512.png',
  './fundo_apontamento.jpg',
  
  // --- CUIDADO COM CDNs ---
  // Se um link desses cair ou mudar, a instalação falha.
  // O ideal é baixar esses arquivos e colocar na pasta do projeto.
  // Mas para manter como está, segue:
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js', 
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js' 
];

// 1. INSTALAÇÃO: Tenta baixar tudo. Se um falhar, não instala.
self.addEventListener('install', event => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  self.skipWaiting(); // Força o SW novo a assumir imediatamente se possível

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).catch(err => {
        console.error('[SW] Falha ao instalar cache:', err);
    })
  );
});

// 2. ATIVAÇÃO: Limpeza profunda de caches antigos
self.addEventListener('activate', event => {
  console.log('[SW] Ativando e limpando antigos...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Se o cache não for o "v18" (o atual), apaga sem dó
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache obsoleto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[SW] Agora controlando os clientes.');
        return self.clients.claim(); // Controla a página imediatamente
    })
  );
});

// 3. INTERCEPTAÇÃO (A Mágica Acontece Aqui)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // A. Ignora Firebase/Google Auth (Deixa a lib lidar com isso)
  if (requestUrl.origin.includes('googleapis.com') || 
      requestUrl.origin.includes('firebase')) {
    return; 
  }

  // B. ESTRATÉGIA HÍBRIDA
  
  // Se for o HTML principal (Navegação), tenta REDE PRIMEIRO (pra ver se tem atualização)
  // Se falhar (offline), pega do Cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
            // Se baixou novo HTML, atualiza o cache
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
            return networkResponse;
        })
        .catch(() => {
            // Sem internet? Abre o cache
            return caches.match(event.request);
        })
    );
    return;
  }

  // C. Para CSS, JS, Imagens, Fontes: STALE-WHILE-REVALIDATE
  // Retorna o cache rápido, mas atualiza em background para a próxima vez
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(e => {
            // Falha silenciosa no fetch de assets (modo offline)
        });

        // Retorna o cache se existir, senão espera o fetch
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// 4. MENSAGEM DE FORÇAR UPDATE
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

