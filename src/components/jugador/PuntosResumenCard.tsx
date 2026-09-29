'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMiSaldoConPromocion, type MiSaldoConPromocionResponse } from '@/lib/api'

export default function PuntosResumenCard() {
  const [data, setData] = useState<MiSaldoConPromocionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    getMiSaldoConPromocion()
      .then(res => {
        if (alive) setData(res)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (failed) return null

  if (loading || !data) {
    return <div aria-hidden className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
  }

  return (
    <Link
      href="/dashboard/jugador/puntos"
      className="flex min-h-20 items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/70 transition-transform active:scale-[0.98] dark:bg-slate-800 dark:ring-white/10"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          stars
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400">Mis Puntos ClubPlaza</span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">
            {data.saldo.toLocaleString('es-AR')}
          </span>
          {data.promocion_activa && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              ¡Hoy x{data.promocion_activa.multiplicador}!
            </span>
          )}
        </span>
      </span>
      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
    </Link>
  )
}
