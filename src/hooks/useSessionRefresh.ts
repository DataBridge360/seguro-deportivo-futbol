import { useEffect, useRef } from 'react'
import { refreshSession } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const REFRESH_AFTER_SECONDS = 24 * 60 * 60

function getIssuedAt(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return typeof payload.iat === 'number' ? payload.iat : null
  } catch {
    return null
  }
}

// Sliding session: renews the JWT when it is older than 24h.
export function useSessionRefresh() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const refreshing = useRef(false)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return

    const maybeRefresh = async () => {
      if (refreshing.current) return
      const { token, setToken } = useAuthStore.getState()
      if (!token) return
      const iat = getIssuedAt(token)
      const now = Math.floor(Date.now() / 1000)
      if (iat !== null && now - iat < REFRESH_AFTER_SECONDS) return

      refreshing.current = true
      try {
        const fresh = await refreshSession()
        if (fresh) setToken(fresh)
      } catch {
        // Silent: a 401 is already handled by apiFetch.
      } finally {
        refreshing.current = false
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void maybeRefresh()
    }

    void maybeRefresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [hasHydrated, isAuthenticated])
}
