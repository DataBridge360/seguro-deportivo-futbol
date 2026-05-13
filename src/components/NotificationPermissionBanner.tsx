'use client';

import { useState, useEffect } from 'react';
import { useFCMToken } from '@/hooks/useFCMToken';

export default function NotificationPermissionBanner() {
  const { permission, loading, error, requestPermission } = useFCMToken();
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (permission === 'granted' || permission === 'denied' || dismissed || !('Notification' in window)) {
    return null;
  }

  const isIOS = /iPhone|iPad/.test(navigator.userAgent);

  if (isIOS && !isStandalone) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl">
          <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-primary/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="relative px-6 pt-8 pb-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/40 mb-4">
              <span className="material-symbols-outlined text-white text-3xl">notifications_active</span>
            </div>

            <h3 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
              Activa las notificaciones
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1.5">
              Para recibir cupones y promociones, instala la app primero:
            </p>

            <div className="mt-5 space-y-2.5 text-left">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                <p className="text-slate-700 dark:text-slate-200 text-sm">
                  Toca el boton <strong>Compartir</strong>
                </p>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                <p className="text-slate-700 dark:text-slate-200 text-sm">
                  Elegi <strong>Agregar a pantalla de inicio</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl">
        <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-primary/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

        <div className="relative px-6 pt-8 pb-6 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/40">
              <span className="material-symbols-outlined text-white text-3xl">notifications_active</span>
            </div>
          </div>

          <h3 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
            Activa las notificaciones
          </h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1.5 leading-relaxed">
            Recibi cupones y promociones al instante
          </p>

          {error && (
            <p className="text-red-500 dark:text-red-300 text-xs mt-3 px-3 py-2 rounded-lg bg-red-50/80 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20">
              {error}
            </p>
          )}

          <button
            onClick={requestPermission}
            disabled={loading}
            className="mt-6 w-full relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/95 hover:to-primary/70 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="relative">Activando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg relative">notifications_active</span>
                <span className="relative">Activar notificaciones</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
