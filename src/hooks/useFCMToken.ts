import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';
import { registerFCMToken } from '@/lib/api';

export function useFCMToken() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Este navegador no soporta notificaciones');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Permiso de notificaciones denegado');
        return false;
      }

      // Obtener messaging
      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        setError('Mensajería no soportada en este navegador');
        return false;
      }

      // Registrar Service Worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      // Obtener token FCM
      console.log('🔑 Solicitando token FCM con VAPID:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...');

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        console.log('✅ Token FCM obtenido:', fcmToken.substring(0, 50) + '...');
        setToken(fcmToken);

        // Enviar al backend
        console.log('📤 Registrando token en backend...');
        await registerFCMToken(fcmToken);
        console.log('✅ Token registrado en backend exitosamente');
        return true;
      } else {
        console.error('❌ No se pudo obtener el token FCM');
        setError('No se pudo obtener el token FCM');
        return false;
      }
    } catch (err: any) {
      console.error('Error solicitando permiso de notificaciones:', err);
      setError(err.message ?? 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mensajes recibidos con la PWA en foreground
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;

      unsubscribe = onMessage(messaging, (payload) => {
        console.log('🔔 [FOREGROUND] Mensaje recibido:', payload);

        // IMPORTANTE: onMessage solo detecta mensajes cuando la app está ABIERTA
        // Para mostrar una notificación visual, necesitamos crearla manualmente:
        if (payload.notification) {
          const { title, body } = payload.notification;

          // Crear notificación nativa del navegador
          if (Notification.permission === 'granted') {
            new Notification(title || 'Nueva notificación', {
              body: body || '',
              icon: '/icon-192.png',
              badge: '/badge-72.png',
              tag: payload.data?.notificacion_id || 'foreground-notification',
            });
          }
        }
      });
    })();

    return () => unsubscribe?.();
  }, []);

  return { token, permission, loading, error, requestPermission };
}
