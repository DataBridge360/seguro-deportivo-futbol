'use client';

import { useEffect, useState } from 'react';
import { useFCMToken } from '@/hooks/useFCMToken';

export default function FCMDebugPanel() {
  const { token, permission } = useFCMToken();
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          setSwStatus(`✅ Activo (scope: ${registration.scope})`);
        } else {
          setSwStatus('❌ No activo');
        }
      });
    } else {
      setSwStatus('❌ No soportado');
    }
  }, []);

  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('🧪 Test de Notificación', {
        body: 'Si ves esto, las notificaciones funcionan correctamente',
        icon: '/icon-192.png',
        tag: 'test',
      });
    } else {
      alert('Permisos no otorgados. Estado: ' + Notification.permission);
    }
  };

  const regenerateToken = async () => {
    if (!confirm('¿Regenerar token FCM? Esto eliminará el token actual y creará uno nuevo.')) {
      return;
    }

    try {
      // Desregistrar todos los service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }

      // Recargar la página para forzar nuevo registro
      alert('Service Workers eliminados. La página se recargará para generar un nuevo token.');
      window.location.reload();
    } catch (error) {
      console.error('Error regenerando token:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700"
        title="Debug FCM"
      >
        <span className="material-symbols-outlined">bug_report</span>
      </button>

      {isVisible && (
        <div className="fixed bottom-32 right-4 z-50 bg-black/90 backdrop-blur-lg text-white p-4 rounded-xl shadow-2xl border border-white/20 max-w-md text-xs font-mono">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">🔧 FCM Debug Panel</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <strong>Permisos:</strong>{' '}
              <span
                className={
                  permission === 'granted'
                    ? 'text-green-400'
                    : permission === 'denied'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }
              >
                {permission}
              </span>
            </div>

            <div>
              <strong>Service Worker:</strong>{' '}
              <span>{swStatus}</span>
            </div>

            <div>
              <strong>Token FCM:</strong>{' '}
              <div className="text-[10px] break-all bg-white/10 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                {token || 'No generado'}
              </div>
            </div>

            <div>
              <strong>URL:</strong> {window.location.protocol}//
              {window.location.host}
            </div>

            <div>
              <strong>Protocolo válido:</strong>{' '}
              {window.location.protocol === 'https:' ||
              window.location.hostname === 'localhost'
                ? '✅ Sí'
                : '❌ No (necesita HTTPS)'}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={testNotification}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 px-3 rounded font-semibold text-sm"
              >
                🧪 Test Local
              </button>
              <button
                onClick={regenerateToken}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 px-3 rounded font-semibold text-sm"
              >
                🔄 Regenerar Token
              </button>
            </div>

            <div className="text-[10px] text-white/60 mt-2 border-t border-white/20 pt-2">
              <strong>Debugging tips:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>
                  Con la app <strong>abierta</strong>: Mirá la consola, deberías
                  ver &quot;🔔 [FOREGROUND] Mensaje recibido&quot;
                </li>
                <li>
                  Con la app <strong>cerrada</strong>: Deberías ver una
                  notificación del sistema
                </li>
                <li>
                  En Chrome DevTools → Application → Service Workers: verificá
                  que esté &quot;activated&quot;
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
