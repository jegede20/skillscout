/* SkillScout service worker — hand-written (next-pwa is unmaintained for the App Router).
 * - Static assets (/_next/static, icons, fonts): cache-first.
 * - Page navigations: network-first, falling back to the cached page, then the home page, when offline.
 * - Other GET requests: network-first with cache fallback.
 * POST requests (e.g. /api/search) are never cached.
 */
const VERSION = 'skillscout-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const PRECACHE = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic = url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/fonts/');
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.mode === 'navigate' || url.pathname.startsWith('/api/') === false)) {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then((hit) => hit || (request.mode === 'navigate' ? caches.match('/') : Response.error())),
      ),
  );
});
