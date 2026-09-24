// Kill-switch service worker.
//
// Este proyecto usó next-pwa en el pasado (dependencia placeholder que nunca
// generó un service worker real en este repo), pero algunos dispositivos
// pueden tener registrado un /sw.js viejo (workbox) desde algún build previo.
// Ese SW huérfano puede interceptar fetch() y servir respuestas cacheadas,
// lo que rompería la navegación (incluida /login).
//
// Este archivo NO agrega funcionalidad de PWA/offline. Su único propósito es
// reemplazar cualquier /sw.js viejo: al activarse, borra los caches que no
// pertenecen a Firebase Messaging, se desregistra a sí mismo y fuerza un
// reload de los clientes controlados para que vuelvan a pedir todo a la red.
//
// No se registra en ningún lugar del código: solo actúa si el browser ya
// tenía un service worker en /sw.js de una instalación anterior.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          // No tocar caches usados por firebase-messaging-sw.js (FCM).
          .filter((name) => !/firebase|fcm/i.test(name))
          .map((name) => caches.delete(name))
      )

      await self.registration.unregister()

      const clientsList = await self.clients.matchAll({ type: 'window' })
      for (const client of clientsList) {
        client.navigate(client.url)
      }
    })()
  )
})
