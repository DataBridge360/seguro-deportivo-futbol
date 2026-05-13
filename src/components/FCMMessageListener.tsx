'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from '@/lib/firebase';

interface ToastData {
  id: number;
  title: string;
  body: string;
  url: string;
  conCupon: boolean;
}

const DURATION = 5000;
const EXIT_MS = 250;

export default function FCMMessageListener() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
  };

  const dismiss = () => {
    clearTimers();
    setExiting(true);
    setMounted(false);
    exitTimerRef.current = setTimeout(() => {
      setToast(null);
      setExiting(false);
    }, EXIT_MS);
  };

  const showToast = (data: Omit<ToastData, 'id'>) => {
    clearTimers();
    setExiting(false);
    setMounted(false);
    setProgress(100);
    setToast({ ...data, id: Date.now() });
  };

  // Disparar animaciones de entrada y barra de progreso después del mount
  useEffect(() => {
    if (!toast) return;
    // Forzar reflow para que la transición de entrada se vea
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      // Empezar la barra de progreso un tick después para que arranque desde 100%
      progressTimerRef.current = setTimeout(() => setProgress(0), 50);
    });
    dismissTimerRef.current = setTimeout(() => dismiss(), DURATION);
    return () => {
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  // Suscribirse a mensajes FCM en foreground
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? payload.data?.title ?? 'Nueva notificacion';
        const body = payload.notification?.body ?? payload.data?.body ?? '';
        const url = (payload.data?.url as string) || '/dashboard/notificaciones';
        const conCupon = payload.data?.type === 'cupon_nuevo';
        showToast({ title, body, url, conCupon });
        // Pedir refresh del badge rojo del layout
        window.dispatchEvent(new Event('notifications:read'));
      });
    })();
    return () => {
      unsubscribe?.();
      clearTimers();
    };
  }, []);

  if (!toast) return null;

  const handleClick = () => {
    const target = toast.url;
    dismiss();
    router.push(target);
  };

  return (
    <div className="fixed top-3 left-3 right-3 z-[200] flex justify-center pointer-events-none">
      <div
        className={`pointer-events-auto w-full max-w-md transition-all duration-300 ease-out ${
          mounted && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'
        }`}
      >
        <button
          type="button"
          onClick={handleClick}
          className="w-full text-left relative overflow-hidden rounded-2xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-primary/25"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3 p-3.5 pr-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                toast.conCupon
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30'
                  : 'bg-gradient-to-br from-primary to-primary/70 text-white shadow-primary/30'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {toast.conCupon ? 'local_offer' : 'notifications_active'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {toast.title}
              </p>
              {toast.body && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                  {toast.body}
                </p>
              )}
            </div>

            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl flex-shrink-0">
              chevron_right
            </span>
          </div>

          {/* Barra de progreso (drena de derecha a izquierda) */}
          <div className="relative h-[3px] bg-primary/10 dark:bg-primary/15">
            <div
              className="absolute inset-y-0 left-0 bg-primary"
              style={{
                width: `${progress}%`,
                transition: `width ${DURATION}ms linear`,
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
