import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';
import { registerFCMToken } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const FCM_TOKEN_KEY = 'fcm-token';
const SW_ACTIVATION_TIMEOUT_MS = 15000;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? '');
}

function stepError(step: string, err?: unknown): Error {
  const detail = err === undefined ? '' : errorMessage(err);
  return new Error(`Falló el paso "${step}"${detail ? `: ${detail}` : ''}`);
}

// Waits until this specific registration has an active worker (not just any SW of the origin).
function waitForActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    const timer = setTimeout(
      () => reject(new Error('el service worker no se activó en 15 segundos')),
      SW_ACTIVATION_TIMEOUT_MS,
    );
    if (!worker) {
      clearTimeout(timer);
      reject(new Error('no hay service worker instalándose'));
      return;
    }
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') {
        clearTimeout(timer);
        resolve();
      } else if (worker.state === 'redundant') {
        clearTimeout(timer);
        reject(new Error('el service worker quedó descartado'));
      }
    });
  });
}

// Full registration: messaging support -> service worker -> Firebase token -> backend.
// Throws an Error naming the failed step. Writes the token to localStorage on success.
async function registerDevice(): Promise<string> {
  const messaging = await getMessagingIfSupported().catch((err) => {
    throw stepError('soporte', err);
  });
  if (!messaging) throw stepError('soporte', new Error('este navegador no soporta notificaciones push'));

  let registration: ServiceWorkerRegistration;
  try {
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await waitForActive(registration);
  } catch (err) {
    throw stepError('service worker', err);
  }

  let fcmToken: string;
  try {
    fcmToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    throw stepError('token de Firebase', err);
  }
  if (!fcmToken) throw stepError('token de Firebase', new Error('Firebase no devolvió un token'));

  try {
    await registerFCMToken(fcmToken);
  } catch (err) {
    throw stepError('servidor', err);
  }

  localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
  return fcmToken;
}

// Silently re-registers the device on app open when permission was already granted.
export function useSilentFCMRegistration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    registerDevice().catch(() => {
      // Silent path: no UI on failure.
    });
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

  // Returns true only after the backend stored the token.
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setError('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'denied') {
      setPermission('denied');
      setError('Las notificaciones están bloqueadas en el navegador para este sitio');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('No diste permiso para las notificaciones');
        return false;
      }

      const fcmToken = await registerDevice();
      setToken(fcmToken);
      return true;
    } catch (err) {
      setPermission(Notification.permission);
      setError(errorMessage(err) || 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { token, permission, loading, error, requestPermission };
}
