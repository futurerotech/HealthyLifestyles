self.addEventListener('push', (event) => {
  let data = { title: 'HealthyLifeStyles', body: '', icon: '/favicon.svg', data: {} };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // fall back to defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: data.data,
      badge: '/favicon.svg',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const matching = windowClients.find((c) => c.url === url);
      if (matching) {
        matching.focus();
      } else {
        clients.openWindow(url);
      }
    }),
  );
});
