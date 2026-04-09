const VERSION = 'debugai-v4.0.0';
const CACHE_NAME = `app-cache-${VERSION}`;
const STATIC_ASSETS = [
  '/app',
  '/manifest.json',
  '/icon.png'
];

// Instalar y cachear los assets críticos del shell PWA
self.addEventListener('install', event => {
  // skipWaiting() permite forzar a la nueva versión (sin esperar que el usuario cierre todas las pestañas)
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

// Limpiar caches viejos y tomar control inmediato
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Estrategia: Network-first, fallback a cache - NUNCA cachear las APIs del backend
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pasar directo al backend sin cache — datos siempre en tiempo real
  const API_PATHS = ['/api','/login','/register','/chats','/mensaje','/check-gift',
    '/claim-gift','/get-perfil','/crear-chat','/update-chat','/chat/',
    '/account','/upload-document','/regenerate-chat','/update-perfil'];

  if (API_PATHS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first para todo lo demás (assets estáticos)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
