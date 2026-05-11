importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// IMPORTANTE: Credenciales de Firebase hardcodeadas
// Estas son las MISMAS credenciales que están en .env
// El Service Worker no puede leer process.env, por eso van hardcodeadas
firebase.initializeApp({
  apiKey: "AIzaSyDtQNRMAPdeWIispTK6GDouR9vtD4QQpew",
  authDomain: "seguro-pwa.firebaseapp.com",
  projectId: "seguro-pwa",
  storageBucket: "seguro-pwa.firebasestorage.app",
  messagingSenderId: "610578990096",
  appId: "1:610578990096:web:9821f990bbdda3ff523695",
});

const messaging = firebase.messaging();

// Manejo de mensajes recibidos cuando la PWA está en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido:', payload);

  const { title, body, icon } = payload.notification ?? {};
  const notificationTitle = title ?? 'Nueva notificación';
  const notificationOptions = {
    body: body ?? '',
    icon: icon ?? '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data,
    tag: payload.data?.notificacion_id ?? 'default',
    requireInteraction: false,
  };

  console.log('[firebase-messaging-sw.js] 🚀 Intentando mostrar notificación:', {
    title: notificationTitle,
    options: notificationOptions
  });

  // Retornar la promesa para que Firebase sepa si funcionó
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[firebase-messaging-sw.js] ✅ Notificación mostrada exitosamente');
    })
    .catch((error) => {
      console.error('[firebase-messaging-sw.js] ❌ Error mostrando notificación:', error);
    });
});

// Click en la notificación: abrir o enfocar la PWA
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Click en notificación:', event);
  event.notification.close();

  const url = event.notification.data?.url ?? '/dashboard/jugador/notificaciones';
  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of windowClients) {
        if (client.url === fullUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
  );
});
