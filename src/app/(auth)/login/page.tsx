'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { getDefaultRouteForRole } from '@/lib/navigation'

type LoginMode = 'email' | 'dni'

export default function LoginPage() {
  const router = useRouter()
  const { login, loginDNI, isLoading, error, clearError, user, isAuthenticated } = useAuthStore()
  const [mode, setMode] = useState<LoginMode>('dni')
  const [email, setEmail] = useState('')
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(getDefaultRouteForRole(user.role))
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    const success = mode === 'email'
      ? await login(email, password)
      : await loginDNI(dni, password)

    if (success) {
      const { user } = useAuthStore.getState()
      if (user) {
        document.cookie = `auth-storage=${JSON.stringify({ state: { user } })}; path=/; max-age=${60 * 60 * 24 * 7}`
        router.replace(getDefaultRouteForRole(user.role))
      }
    }
  }

  const toggleMode = () => {
    clearError()
    setMode(mode === 'email' ? 'dni' : 'email')
    setPassword('')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-background-dark soccer-bg">
      {/* Main Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden football-pattern animate-fade-in">
        {/* Top Header with Logo */}
        <div className="pt-8 pb-4 flex flex-col items-center px-6">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="Logo del Complejo Deportivo"
              width={160}
              height={160}
              className="w-40 h-40 object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white text-center leading-tight tracking-tight">
            Complejo Deportivo <span className="block text-primary">Plaza Huincul</span>
          </h1>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-center text-xs font-medium">
            Tu portal deportivo en Plaza Huincul
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          <div className="space-y-3">
            {mode === 'email' ? (
              /* Email Field */
              <div key="email" className="space-y-1.5 animate-fade-in">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Correo Electr&oacute;nico
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="ejemplo@correo.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            ) : (
              /* DNI Field */
              <div key="dni" className="space-y-1.5 animate-fade-in">
                <label htmlFor="dni" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  DNI
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    badge
                  </span>
                  <input
                    id="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Ingres&aacute; tu DNI"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Contrase&ntilde;a
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
              {mode === 'email' && (
                <div className="flex justify-end">
                  <a className="text-xs font-semibold text-primary hover:underline mt-1 cursor-pointer">
                    &iquest;Olvidaste tu contrase&ntilde;a?
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Ingresando...
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase tracking-widest font-bold">o</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={toggleMode}
              className="w-full bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {mode === 'email' ? (
                <>
                  <span className="material-symbols-outlined text-primary">sports_soccer</span>
                  Soy jugador &mdash; Ingresar con DNI
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-primary">mail</span>
                  Soy staff &mdash; Ingresar con email
                </>
              )}
            </button>
          </div>
        </form>

        {/* Decorative Grass Base */}
        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center px-4">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          &iquest;Necesitas ayuda?{' '}
          <a className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            Contactar soporte
          </a>
        </p>
        <div className="mt-6 opacity-60 flex items-center justify-center gap-1 text-xs uppercase tracking-tighter text-slate-400">
          <span className="material-symbols-outlined text-sm">location_on</span>
          Plaza Huincul, Neuqu&eacute;n
        </div>
      </footer>

    </div>
  )
}
