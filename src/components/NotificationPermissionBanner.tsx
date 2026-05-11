'use client';

import { useState, useEffect } from 'react';
import { useFCMToken } from '@/hooks/useFCMToken';

export default function NotificationPermissionBanner() {
  const { permission, loading, error, requestPermission } = useFCMToken();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar si está en modo standalone (PWA instalada)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  // No mostrar si:
  // - Ya tiene permiso
  // - El usuario lo descartó
  // - No hay soporte
  if (permission === 'granted' || dismissed || !('Notification' in window)) {
    return null;
  }

  // En iOS, solo mostrar si está instalado como PWA
  const isIOS = /iPhone|iPad/.test(navigator.userAgent);
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-lg bg-opacity-95 rounded-xl p-4 shadow-lg border border-white/20 z-50">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-white text-2xl">
            notifications
          </span>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              Recibí notificaciones de cupones
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Para activar notificaciones, instalá la app:
              <br />
              1. Tocá el botón <strong>Compartir</strong>
              <br />
              2. Elegí <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-lg bg-opacity-95 rounded-xl p-4 shadow-lg border border-white/20 z-50 max-w-md mx-auto">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-white text-2xl">
          notifications_active
        </span>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">
            Activá las notificaciones
          </h3>
          <p className="text-white/90 text-sm mb-3">
            Recibí alertas instantáneas cuando el club envíe cupones y promociones
          </p>
          {error && (
            <p className="text-red-200 text-xs mb-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={requestPermission}
              disabled={loading}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Activando...' : 'Activar'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white text-sm px-3"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
