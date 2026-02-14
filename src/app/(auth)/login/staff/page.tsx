'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { getDefaultRouteForRole } from '@/lib/navigation'

export default function LoginStaffPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError, user, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState('')
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

    const success = await login(email, password)

    if (success) {
      const { user } = useAuthStore.getState()
      if (user) {
        document.cookie = `auth-storage=${JSON.stringify({ state: { user } })}; path=/; max-age=${60 * 60 * 24 * 7}`
        router.replace(getDefaultRouteForRole(user.role))
      }
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pitch-pattern">
      {/* Header */}
      <div className="flex items-center p-6 justify-center">
        <h2 className="text-[#111518] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          Seguro Deportivo
        </h2>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 px-6 justify-center pb-20">
        <div className="py-6">
          <h1 className="text-[#111518] dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
            Bienvenido
          </h1>
          <p className="text-[#111518] dark:text-white/70 text-base font-normal leading-normal pt-2 px-8 text-center max-w-sm mx-auto">
            Ingresá con tu email para gestionar tus seguros
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-md mx-auto w-full">
          {/* Email input */}
          <div className="py-2">
            <label className="flex flex-col">
              <p className="text-[#111518] dark:text-white text-sm font-medium leading-normal pb-2 ml-1">
                Email
              </p>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-[#617989]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex w-full rounded-xl text-[#111518] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe1e6] dark:border-[#344857] bg-white dark:bg-[#1c2a35] h-14 placeholder:text-[#617989] pl-12 pr-4 text-base font-normal leading-normal"
                  placeholder="Ingresá tu email"
                  required
                  autoComplete="email"
                />
              </div>
            </label>
          </div>

          {/* Password input */}
          <div className="py-2">
            <label className="flex flex-col">
              <p className="text-[#111518] dark:text-white text-sm font-medium leading-normal pb-2 ml-1">
                Contraseña
              </p>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-4 text-[#617989]">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex w-full rounded-xl text-[#111518] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe1e6] dark:border-[#344857] bg-white dark:bg-[#1c2a35] h-14 placeholder:text-[#617989] pl-12 pr-12 text-base font-normal leading-normal"
                  placeholder="Ingresá tu contraseña"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="material-symbols-outlined absolute right-4 text-[#617989] cursor-pointer hover:text-primary transition-colors"
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </label>
          </div>

          {/* Forgot password */}
          <div className="flex justify-end py-1">
            <a className="text-primary text-sm font-medium hover:underline cursor-pointer">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit button */}
          <div className="py-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-lg">login</span>
                </>
              )}
            </button>
          </div>

          {/* Link to jugador login */}
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="flex items-center w-full gap-4">
              <div className="h-[1px] bg-[#dbe1e6] dark:bg-[#344857] flex-1"></div>
              <span className="text-[#617989] text-xs font-bold uppercase tracking-widest">o</span>
              <div className="h-[1px] bg-[#dbe1e6] dark:bg-[#344857] flex-1"></div>
            </div>

            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 h-14 rounded-xl border border-[#dbe1e6] dark:border-[#344857] text-[#111518] dark:text-white font-medium hover:bg-white/50 dark:hover:bg-[#1c2a35]/50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">sports_soccer</span>
              <span>Soy jugador — Ingresar con DNI</span>
            </Link>
          </div>
        </form>
      </div>

      {/* Bottom indicator */}
      <div className="h-8 flex justify-center items-end pb-2">
        <div className="w-32 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  )
}
