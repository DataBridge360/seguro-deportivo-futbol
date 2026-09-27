'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { restablecerPassword } from '@/lib/api'
import { getPasswordIssues } from '@/lib/passwordRules'
import BallsBackground from '@/components/auth/BallsBackground'

// ---------------------------------------------------------------------------
// Restablecer contraseña: lee el token de la URL (link enviado por correo).
// useSearchParams necesita un <Suspense> para permitir el prerenderizado
// estático de esta ruta en Next 16.
// ---------------------------------------------------------------------------

// Matches the backend's invalid, expired and already-used link messages,
// which all end with "Pedí uno nuevo".
const INVALID_OR_EXPIRED_REGEX = /ped[ií] uno nuevo/i

type Step = 'form' | 'success'

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-sky-400 via-primary to-blue-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950">
      <BallsBackground />
      <div className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-950/40 ring-1 ring-white/60 dark:ring-slate-700/50 overflow-hidden football-pattern animate-slide-up">
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
            Nueva contraseña
          </h1>
        </div>

        <div className="px-6 pb-8 space-y-4">{children}</div>

        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>
    </div>
  )
}

function RestablecerForm({ token }: { token: string }) {
  const [step, setStep] = useState<Step>('form')

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const passwordIssues = getPasswordIssues(password)

  const validate = (): boolean => {
    let ok = true

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
      const res = await restablecerPassword({
        token,
        password,
        password_confirmacion: passwordConfirm,
      })
      setSuccessMessage(res.message)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="space-y-4 animate-fade-in text-center" role="status" aria-live="polite">
        <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{successMessage}</p>
        <a
          href="/login"
          className="block w-full bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          Iniciar sesión
        </a>
      </div>
    )
  }

  const showPedirLinkNuevo = error ? INVALID_OR_EXPIRED_REGEX.test(error) : false

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
          Nueva contraseña
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
          <p className="text-sm text-red-500 ml-1" aria-live="polite">
            {passwordConfirmError}
          </p>
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
        <div
          className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
          aria-live="polite"
        >
          <p>{error}</p>
          {showPedirLinkNuevo && (
            <a href="/recuperar" className="inline-block mt-1.5 font-bold hover:underline">
              Pedir un link nuevo
            </a>
          )}
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
            <span>Guardar contraseña</span>
            <span className="material-symbols-outlined text-lg">check_circle</span>
          </>
        )}
      </button>
    </div>
  )
}

function RestablecerContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <span className="material-symbols-outlined text-5xl text-red-500">error</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          El link no es válido o ya venció.
        </p>
        <a href="/recuperar" className="text-primary font-bold hover:underline">
          Pedir un link nuevo
        </a>
      </div>
    )
  }

  return <RestablecerForm token={token} />
}

export default function RestablecerPage() {
  return (
    <CardShell>
      <Suspense fallback={null}>
        <RestablecerContent />
      </Suspense>
    </CardShell>
  )
}
