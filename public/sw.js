// OSIG service worker: push notifications only (no offline caching of private data).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'OSIG';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/#/footprint' },
    tag: data.tag || 'osig',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Only same-origin destinations
  const target = new URL(event.notification.data && event.notification.data.url || '/', self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of windows) {
      if ('focus' in w) { await w.navigate(target.href); return w.focus(); }
    }
    return self.clients.openWindow(target.href);
  })());
});
