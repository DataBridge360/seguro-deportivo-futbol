'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { BellRing, ChevronRight, Globe, Loader2, MapPin } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import { useAuthStore } from '@/stores/authStore'
import InstallAppButton from '@/components/ui/InstallAppButton'
import BallsBackground from '@/components/auth/BallsBackground'

// Icons on this screen are inline SVG (lucide) instead of the Material Symbols
// font: it is the first screen a new visitor sees, with nothing cached, and the
// 3.9 MB icon font can take long enough that the browser shows the ligature
// names ("smartphone", "language") as plain text.

const BACKGROUND =
  'relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-sky-400 via-primary to-blue-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950'

export default function HomePage() {
  const router = useRouter()
  const { isStandalone, isReady } = usePWA()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isReady || !isStandalone) return
    router.replace(isAuthenticated ? '/dashboard' : '/login')
  }, [isStandalone, isAuthenticated, isReady, router])

  // Installed app: this screen only redirects.
  if (!isReady || isStandalone) {
    return (
      <div className={BACKGROUND}>
        <Loader2 className="w-10 h-10 text-white animate-spin" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div className={BACKGROUND}>
      <BallsBackground />

      <div className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-950/40 ring-1 ring-white/60 dark:ring-slate-700/50 overflow-hidden football-pattern animate-slide-up">
        {/* Header */}
        <div className="pt-8 pb-6 flex flex-col items-center px-6">
          <Image
            src="/logo.png"
            alt="Logo del Complejo Deportivo"
            width={110}
            height={110}
            className="w-24 h-24 object-contain mb-3"
            priority
          />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white text-center leading-tight tracking-tight">
            Complejo Deportivo <span className="text-primary">Plaza Huincul</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">
            ¿Cómo querés entrar?
          </p>
        </div>

        {/* Options */}
        <div className="px-6 pb-8 space-y-3">
          <InstallAppButton variant="hero" />

          <button
            onClick={() => router.push('/login')}
            className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-left transition-all active:scale-[0.98]"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex-shrink-0">
              <Globe className="w-6 h-6" aria-hidden="true" />
            </span>
            <span className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-slate-900 dark:text-white">Usar versión web</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Entrá desde el navegador, sin instalar nada</span>
            </span>
            <ChevronRight
              className="w-5 h-5 text-primary/70 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <p className="flex items-start gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <BellRing className="w-4 h-4 text-primary flex-shrink-0 mt-px" aria-hidden="true" />
            Con la app instalada recibís las notificaciones del club en tu celular.
          </p>
        </div>

        {/* Decorative Grass Base */}
        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-6 text-center px-4">
        <div className="opacity-80 flex items-center justify-center gap-1 text-xs uppercase tracking-tighter text-white/80">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          Plaza Huincul, Neuquén
        </div>
      </footer>
    </div>
  )
}
