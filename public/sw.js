/**
 * ============================================================================
 * RBlock Adventure - Service Worker (sw.js)
 * Enables 100% Offline Gameplay and PWA caching for Vite Production Build
 * ============================================================================
 */

const CACHE_NAME = 'rblock-adventure-v2.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First for static assets & Vite bundles, Network-First with fallback for API
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' && !event.request.url.includes('/api/')) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // If request is to Cloudflare Functions API (/api/leaderboard or /api/shoutcaster)
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          if (requestUrl.pathname.startsWith('/api/shoutcaster')) {
            return new Response(
              JSON.stringify({
                success: false,
                source: 'offline_fallback',
                comment: null
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              source: 'offline_fallback',
              leaderboard: [
                { name: "RB_Master", score: 12500, date: "2026-09-01T12:00:00.000Z" },
                { name: "CandyQueen", score: 9800, date: "2026-09-02T14:30:00.000Z" },
                { name: "JellyStar", score: 7450, date: "2026-09-03T09:15:00.000Z" }
              ],
              message: "Mode Offline Aktif (Skor lokal tersimpan)"
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // For static local assets, Vite /assets/* bundles & Google fonts: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (requestUrl.origin === location.origin || requestUrl.hostname.includes('fonts.g'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
