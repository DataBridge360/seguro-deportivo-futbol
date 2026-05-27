import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
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

    if (Notification.permission === 'denied') {
      setPermission('denied');
      setError('Las notificaciones estan bloqueadas en el navegador para este sitio');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('Permiso de notificaciones no otorgado');
        return false;
      }

      if (Notification.permission !== 'granted') {
        setPermission(Notification.permission);
        setError('El navegador no dejo habilitado el permiso de notificaciones');
        return false;
      }

      console.log('Solicitando token FCM con VAPID:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...');

      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        setError('Mensajeria no soportada en este navegador');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (fcmToken) {
        console.log('Token FCM obtenido:', fcmToken.substring(0, 50) + '...');
        setToken(fcmToken);

        console.log('Registrando token en backend...');
        await registerFCMToken(fcmToken);
        console.log('Token registrado en backend exitosamente');
        return true;
      } else {
        console.warn('No se pudo obtener el token FCM');
        setError('No se pudo obtener el token FCM');
        return false;
      }
    } catch (err: any) {
      console.warn('Error solicitando permiso de notificaciones:', err);
      const message = String(err?.message ?? '');
      if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('permission')) {
        setPermission(Notification.permission);
        setError('El navegador rechazo la suscripcion push. Revisar permisos del sitio.');
      } else {
        setError(message || 'Error desconocido');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { token, permission, loading, error, requestPermission };
}
