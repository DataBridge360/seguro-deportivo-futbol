'use client';

import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';

/**
 * Componente que escucha mensajes de FCM en foreground
 * Solo debe ser montado UNA VEZ en el layout principal
 */
export default function FCMMessageListener() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 [FOREGROUND] Mensaje recibido:', payload);

        // NOTA: NO creamos notificación manual aquí para evitar duplicados
        // El Service Worker (firebase-messaging-sw.js) maneja TODAS las notificaciones visuales
        // Aquí solo actualizamos el estado interno de la app si es necesario

        // Si necesitas actualizar algún estado o contador en la app, hazlo aquí
        // Por ejemplo: refrescar la lista de notificaciones, actualizar badge, etc.
      });
    })();

    return () => unsubscribe?.();
  }, []);

  return null; // Este componente no renderiza nada
}
