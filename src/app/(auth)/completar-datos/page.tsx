'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { getDefaultRouteForRole } from '@/lib/navigation'
import { completarDatos } from '@/lib/api'
import BallsBackground from '@/components/auth/BallsBackground'

// ---------------------------------------------------------------------------
// Validaciones (reflejan las reglas del backend en español para feedback
// inmediato; el backend siempre vuelve a validar).
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CompletarDatosPage() {
  const { user, isAuthenticated, _hasHydrated, markDatosCompletos, logout } = useAuthStore()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const didInitRef = useRef(false)
  const emailPrefilledRef = useRef(false)

  useEffect(() => {
    if (!_hasHydrated || didInitRef.current) return
    didInitRef.current = true

    if (!isAuthenticated || !user) {
      window.location.replace('/login')
      return
    }

    if (!(user.role === 'jugador' && user.debe_cambiar_password)) {
      window.location.replace(getDefaultRouteForRole(user.role))
    }
  }, [_hasHydrated, isAuthenticated, user])

  useEffect(() => {
    if (emailPrefilledRef.current) return
    if (user?.email) {
      setEmail(user.email)
      emailPrefilledRef.current = true
    }
  }, [user])

  // Live list of unmet password requirements, shown while typing.
  const passwordIssues: string[] = []
  if (password.length < 8) passwordIssues.push('Debe tener al menos 8 caracteres')
  if (!/\p{L}/u.test(password)) passwordIssues.push('Debe contener al menos una letra')
  if (!/\d/.test(password)) passwordIssues.push('Debe contener al menos un número')
  // bcrypt limit; rare enough that the hint does not mention it.
  if (password.length > 72) passwordIssues.push('La contraseña es demasiado larga')

  const validate = (): boolean => {
    let ok = true

    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      setEmailError('Ingresá un email válido')
      ok = false
    } else {
      setEmailError(null)
    }

    if (password !== passwordConfirm) {
      setPasswordConfirmError('Las contraseñas no coinciden')
      ok = false
    } else {
      setPasswordConfirmError(null)
    }

    if (passwordIssues.length > 0) {
      ok = false
    }

    return ok
  }

  const handleSubmit = async () => {
    if (isLoading) return
    setError(null)

    if (!validate()) return

    setIsLoading(true)
    try {
      const trimmedEmail = email.trim()
      const result = await completarDatos({
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        password,
        password_confirmacion: passwordConfirm,
      })
      markDatosCompletos(result.email)
      const { user: currentUser } = useAuthStore.getState()
      window.location.replace(getDefaultRouteForRole(currentUser?.role ?? 'jugador'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
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
            Completá tus datos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">
            Por seguridad, elegí una contraseña nueva para seguir usando la app.
          </p>
        </div>

        <div className="px-6 pb-8 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Correo electrónico (opcional)
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
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>
            {emailError && <p className="text-sm text-red-500 ml-1">{emailError}</p>}
          </div>

          {!user?.email && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg text-sm">
              Todavía no tenés un correo cargado. Te recomendamos agregarlo: lo vas a necesitar para recuperar tu contraseña.
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Contraseña nueva
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
                placeholder="Mínimo 8 caracteres, con letra y número"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
              >
                {showPassword ? 'visibility_off' : 'visibility'}
              </button>
            </div>
            {password.length > 0 && passwordIssues.length > 0 && (
              <ul className="space-y-1 ml-1" aria-live="polite">
                {passwordIssues.map((issue) => (
                  <li key={issue} className="flex items-center gap-1.5 text-sm text-red-500">
                    <span className="material-symbols-outlined text-base">error</span>
                    {issue}
                  </li>
                ))}
              </ul>
            )}
            {password.length > 0 && passwordIssues.length === 0 && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 ml-1" aria-live="polite">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Contraseña válida
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="passwordConfirm" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
              Repetir contraseña
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                lock
              </span>
              <input
                id="passwordConfirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                placeholder="Repetí tu contraseña"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
              >
                {showPasswordConfirm ? 'visibility_off' : 'visibility'}
              </button>
            </div>
            {passwordConfirmError ? (
              <p className="text-sm text-red-500 ml-1">{passwordConfirmError}</p>
            ) : (
              passwordConfirm.length > 0 && (
                <p
                  className={`text-sm ml-1 ${
                    password === passwordConfirm ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                  }`}
                >
                  {password === passwordConfirm ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </p>
              )
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              <p>{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Guardando...
              </>
            ) : (
              <>
                <span>Guardar y continuar</span>
                <span className="material-symbols-outlined text-lg">check_circle</span>
              </>
            )}
          </button>

          <p className="text-center text-sm pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-500 dark:text-slate-400 hover:underline"
            >
              Cerrar sesión
            </button>
          </p>
        </div>

        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>
    </div>
  )
}
