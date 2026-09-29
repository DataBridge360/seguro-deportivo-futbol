'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TablaPage() {
  const router = useRouter()
  useEffect(() => {
    const torneo = new URLSearchParams(window.location.search).get('torneo')
    const qs = torneo ? `?torneo=${encodeURIComponent(torneo)}` : ''
    router.replace(`/dashboard/jugador/puntos/equipos${qs}`)
  }, [router])
  return null
}
