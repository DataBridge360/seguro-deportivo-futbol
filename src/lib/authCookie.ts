// Helper centralizado para leer/escribir la cookie `auth-storage`.
// El middleware (src/middleware.ts) lee esta cookie para decidir si una
// request a /dashboard está autenticada. El store (zustand) es la fuente
// de verdad en el cliente; esta cookie es solo un espejo para el server.

import { User } from '@/types'

const COOKIE_NAME = 'auth-storage'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

function cookieAttributes(maxAge?: number): string {
  const parts = ['path=/']
  if (typeof maxAge === 'number') {
    parts.push(`max-age=${maxAge}`)
  }
  parts.push('SameSite=Lax')
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    parts.push('Secure')
  }
  return parts.join('; ')
}

export function setAuthCookie(user: User): void {
  if (typeof document === 'undefined') return
  // NOTA: el middleware (src/middleware.ts) hace JSON.parse(cookie.value) sin
  // decodeURIComponent, así que el valor va sin encodear para mantener
  // compatibilidad exacta con lo que el middleware espera leer.
  const value = JSON.stringify({ state: { user } })
  document.cookie = `${COOKIE_NAME}=${value}; ${cookieAttributes(MAX_AGE_SECONDS)}`
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; ${cookieAttributes(0)}`
}

export function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${COOKIE_NAME}=`))
}
