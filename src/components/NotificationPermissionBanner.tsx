'use client';

import { useEffect, useState } from 'react';
import { useFCMToken } from '@/hooks/useFCMToken';

const DENIED_DISMISS_KEY = 'fcm-denied-dismissed';

export default function NotificationPermissionBanner() {
  const { permission, loading, error, requestPermission } = useFCMToken();
  const [dismissed, setDismissed] = useState(false);
  const [deniedDismissed, setDeniedDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('Notification' in window);
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
    );
    try {
      setDeniedDismissed(sessionStorage.getItem(DENIED_DISMISS_KEY) === '1');
    } catch {
      // sessionStorage unavailable: notice stays dismissible for this render only
    }
  }, []);

  if (!supported || dismissed || permission === 'granted') return null;

  // Blocked: small, dismissible notice (not a blocker)
  if (permission === 'denied') {
    if (deniedDismissed) return null;
    return (
      <div className="fixed bottom-24 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-500/30 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">notifications_off</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Tenés las notificaciones bloqueadas</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Tocá el candado junto a la dirección, entrá a <strong>Notificaciones</strong>, elegí <strong>Permitir</strong> y recargá la página.
            </p>
          </div>
          <button
            onClick={() => {
              setDeniedDismissed(true);
              try {
                sessionStorage.setItem(DENIED_DISMISS_KEY, '1');
              } catch {
                // ignore
              }
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </div>
    );
  }

  const isIOS = /iPhone|iPad/.test(navigator.userAgent);

  if (isIOS && !isStandalone) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-purple-500/30 blur-3xl" />
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <div className="relative px-6 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/40">
              <span className="material-symbols-outlined text-3xl text-white">notifications_active</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Activá las notificaciones</h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Para recibir cupones y promociones, instalá la app primero:
            </p>
            <div className="mt-5 space-y-2.5 text-left">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/60 px-3 py-2.5 dark:border-slate-700/40 dark:bg-slate-800/40">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">1</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Tocá el botón <strong>Compartir</strong>
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/60 px-3 py-2.5 dark:border-slate-700/40 dark:bg-slate-800/40">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">2</div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Elegí <strong>Agregar a pantalla de inicio</strong>
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
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="relative px-6 pb-6 pt-8 text-center">
          <div className="relative mx-auto mb-4 h-16 w-16">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-primary/30 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/40">
              <span className="material-symbols-outlined text-3xl text-white">notifications_active</span>
            </div>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Activá las notificaciones</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Recibí cupones y promociones al instante</p>
          {error && (
            <p className="mt-3 rounded-lg border border-red-200/60 bg-red-50/80 px-3 py-2 text-xs text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
          <button
            onClick={requestPermission}
            disabled={loading}
            className="group relative mt-6 flex min-h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:from-primary/95 hover:to-primary/70 hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span className="relative">Activando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined relative text-lg">notifications_active</span>
                <span className="relative">Activar notificaciones</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
