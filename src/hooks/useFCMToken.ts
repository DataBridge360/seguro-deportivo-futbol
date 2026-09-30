import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';
import { registerFCMToken } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

async function fetchFCMToken(): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  await navigator.serviceWorker.ready;

  const fcmToken = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  return fcmToken || null;
}

// Silently re-registers the FCM token on app open when permission was already granted.
export function useSilentFCMRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    let cancelled = false;
    (async () => {
      try {
        const fcmToken = await fetchFCMToken();
        if (!fcmToken || cancelled) return;
        await registerFCMToken(fcmToken);
        localStorage.setItem('fcm-token', fcmToken);
      } catch {
        // Silent path: never surface errors.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated]);
}

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

      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        setError('Mensajeria no soportada en este navegador');
        return false;
      }

      const fcmToken = await fetchFCMToken();

      if (fcmToken) {
        setToken(fcmToken);
        await registerFCMToken(fcmToken);
        localStorage.setItem('fcm-token', fcmToken);
        return true;
      } else {
        setError('No se pudo obtener el token FCM');
        return false;
      }
    } catch (err: any) {
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
