// public/sw.js - OneStop Service Worker for Mobile & Desktop Notifications

const SW_VERSION = 'v1.0.1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle notification tap / click on mobile phones and desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (targetUrl && targetUrl !== '/' && !client.url.includes(targetUrl)) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Optional background push handler
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
