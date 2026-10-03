// public/sw.js - OneStop Service Worker with PWA Offline Caching & Push Notifications

const SW_VERSION = 'v1.2.0';
const CACHE_NAME = `onestop-static-${SW_VERSION}`;

// Precache essential application shell assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/favicon.svg',
  '/onestop-icon.png',
  '/logo-onestop.png',
  '/onestop-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('onestop-static-')) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event listener: Network-first for navigation, stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests
  if (req.method !== 'GET') return;

  // Skip dynamic API requests, Supabase, PostHog, or external origins
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('posthog.com') ||
    url.hostname.includes('unstop.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    return; // Direct network
  }

  // 1. Navigation requests (HTML page): Network-first with cache fallback for offline access
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          // One cached app shell, never keyed by URL: page URLs can carry one-time
          // tokens (password links) that must not be stored on the device
          const isAppShell = !/^\/(privacy|terms)(\.html)?$/.test(url.pathname);
          if (networkRes.ok && isAppShell) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || caches.match(req);
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts): Stale-while-revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes.ok) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return networkRes;
          })
          .catch(() => cachedRes);

        return cachedRes || fetchPromise;
      })
    );
  }
});

// Handle notification tap / click on mobile phones and desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetUrl && targetUrl !== '/' && !client.url.includes(targetUrl)) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Background push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'OneStop Deadline Alert';
    const options = {
      body: payload.body || 'New deadline update',
      icon: payload.icon || '/onestop-icon.png',
      badge: '/favicon.png',
      tag: payload.tag || undefined,
      data: { url: payload.url || '/' },
      vibrate: [200, 100, 200]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('OneStop Alert', {
        body: text,
        icon: '/onestop-icon.png',
        badge: '/favicon.png',
        data: { url: '/' }
      })
    );
  }
});
