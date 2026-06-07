/* ============================================================
   Sri Lanka Prayer Times — Service Worker
   Strategy:
     SHELL  (HTML, CSS, JS, font, icons) → cache-first, updated on new deploy
     DATA   (zone JSON files)            → stale-while-revalidate
     GEO    (zones.geojson)              → cache-first once fetched
     GA4    (googletagmanager.com)       → network-only, never cache
   ============================================================ */

// __GIT_SHA__ is replaced automatically by the GitHub Actions deploy workflow.
// Never edit this manually — it self-updates on every push.
const SHELL_VERSION = '__GIT_SHA__';
const SHELL_CACHE   = `shell-${SHELL_VERSION}`;
const DATA_CACHE    = 'data-v1';     // zone JSON — survives shell updates

const SHELL_ASSETS = [
  '/',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/fonts/plus-jakarta-sans.woff2',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/manifest.json',
];

// ── Install: pre-cache the shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

// ── Activate: delete old shell caches ────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('shell-') && k !== SHELL_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route requests to the right strategy ──────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept analytics / external non-origin requests (except fonts we self-host)
  if (url.hostname !== self.location.hostname) return;

  // Zone data files → stale-while-revalidate
  // (serve instantly from cache, refresh in background so next load is fresh)
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(DATA_CACHE, event.request));
    return;
  }

  // Everything else (shell assets) → cache-first
  event.respondWith(cacheFirst(SHELL_CACHE, event.request));
});

// ── Strategy: cache-first ─────────────────────────────────
// Return cached copy if available; fall back to network and cache the result.
async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and nothing cached — return a bare fallback for navigations
    if (request.mode === 'navigate') {
      const cached = await caches.match('/');
      if (cached) return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── Strategy: stale-while-revalidate ─────────────────────
// Return cached copy instantly; fetch update in background and cache it.
async function staleWhileRevalidate(cacheName, request) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Kick off a background network fetch regardless
  const networkFetch = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  // Return cached immediately if we have it, else wait for network
  return cached || networkFetch;
}
