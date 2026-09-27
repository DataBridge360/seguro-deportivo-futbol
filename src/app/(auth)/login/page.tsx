'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { getPostLoginRoute } from '@/lib/navigation'
import { clearAuthCookie, setAuthCookie } from '@/lib/authCookie'
import InstallAppButton from '@/components/ui/InstallAppButton'
import BallsBackground from '@/components/auth/BallsBackground'

type LoginMode = 'usuario' | 'dni'

export default function LoginPage() {
  const { login, loginDNI, isLoading, error, clearError, user, isAuthenticated, _hasHydrated } = useAuthStore()
  const [mode, setMode] = useState<LoginMode>('dni')
  const [usuario, setUsuario] = useState('')
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Evita que el submit dispare una redirección duplicada vía el efecto de abajo
  // (ese efecto solo debe reaccionar a un usuario que YA estaba logueado al entrar).
  const submittingRef = useRef(false)
  // Garantiza que la limpieza/redirección inicial corra una sola vez,
  // y recién cuando el store terminó de leer la sesión guardada.
  const didInitRef = useRef(false)

  useEffect(() => {
    if (!_hasHydrated || didInitRef.current) return
    didInitRef.current = true

    // Solo al montar: si NO hay sesión en el store, esta pantalla de login
    // es la fuente de verdad y no debe quedar una cookie vieja/huérfana que
    // el middleware use para redirigir /login -> /dashboard.
    // Si SÍ hay sesión (usuario ya autenticado que volvió a /login), nunca
    // borramos su cookie: solo lo mandamos a su ruta con navegación dura
    // para evitar una redirección soft en carrera con handleSubmit.
    if (isAuthenticated && user) {
      if (!submittingRef.current) {
        window.location.replace(getPostLoginRoute(user))
      }
      return
    }

    clearAuthCookie()
    // Depende solo de _hasHydrated; didInitRef evita que vuelva a correr
    // cuando un login exitoso cambia isAuthenticated/user.
    // (este repo no tiene eslint-plugin-react-hooks, no hace falta eslint-disable)
  }, [_hasHydrated])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    clearError()

    const success = mode === 'usuario'
      ? await login(usuario, password)
      : await loginDNI(dni, password)

    if (success) {
      submittingRef.current = true
      const { user } = useAuthStore.getState()
      if (user) {
        setAuthCookie(user)
        // Navegación dura: el browser hace un request real a la ruta destino,
        // enviando la cookie recién escrita y sin reusar caché de RSC/redirects
        // del router de Next (a diferencia de router.replace, que es soft nav).
        window.location.replace(getPostLoginRoute(user))
      }
    }
  }

  const toggleMode = () => {
    clearError()
    setMode(mode === 'usuario' ? 'dni' : 'usuario')
    setPassword('')
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-sky-400 via-primary to-blue-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950">
      <BallsBackground />
      <div className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-950/40 ring-1 ring-white/60 dark:ring-slate-700/50 overflow-hidden football-pattern animate-slide-up">
        {/* Header */}
        <div className="pt-8 pb-4 flex flex-col items-center px-6">
          <div className="mb-3">
            <Image
              src="/logo.png"
              alt="Logo del Complejo Deportivo"
              width={110}
              height={110}
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white text-center leading-tight tracking-tight">
            Complejo Deportivo <span className="text-primary">Plaza Huincul</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">
            Tu portal deportivo en Plaza Huincul
          </p>
          {mode === 'usuario' && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-sm">manage_accounts</span>
              Ingreso de staff
            </span>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-4">
          <div className="space-y-3">
            {mode === 'usuario' ? (
              /* Usuario Field */
              <div key="usuario" className="space-y-1.5 animate-fade-in">
                <label htmlFor="usuario" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Usuario
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    person
                  </span>
                  <input
                    id="usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Ingresá tu usuario"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Ingresá tu DNI"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Contraseña
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
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
              {mode === 'dni' && (
                <p className="text-right">
                  <a href="/recuperar" className="text-sm text-primary font-semibold hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </p>
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

            {mode === 'dni' && (
              <>
                <a
                  href="/registro"
                  className="w-full bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-primary">person_add</span>
                  Crear cuenta nueva
                </a>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  ¿Primera vez? Registrate en 2 minutos.
                </p>
              </>
            )}

            {mode === 'dni' ? (
              <p className="text-center pt-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="inline-flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:underline transition-colors"
                >
                  <span className="material-symbols-outlined text-base">manage_accounts</span>
                  ¿Sos staff?
                </button>
              </p>
            ) : (
              <p className="text-center pt-1">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline transition-colors"
                >
                  <span className="material-symbols-outlined text-base">sports_soccer</span>
                  Volver al ingreso de jugadores
                </button>
              </p>
            )}
          </div>
        </form>

        {/* Decorative Grass Base */}
        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>

      {/* Install App Banner */}
      <div className="relative z-10 w-full max-w-md mt-4">
        <InstallAppButton />
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-6 text-center px-4">
        <div className="opacity-80 flex items-center justify-center gap-1 text-xs uppercase tracking-tighter text-white/80">
          <span className="material-symbols-outlined text-sm">location_on</span>
          Plaza Huincul, Neuquén
        </div>
      </footer>

    </div>
  )
}
