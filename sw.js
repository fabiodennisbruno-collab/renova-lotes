self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function () {});

/* Background sync — dispara quando a conexão é restaurada */
self.addEventListener('sync', function (e) {
  if (e.tag === 'renova-sync-queue') {
    e.waitUntil(
      self.clients.matchAll().then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
        });
      })
    );
  }
});
