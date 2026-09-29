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
    return <div aria-hidden className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
  }

  return (
    <Link
      href="/dashboard/jugador/puntos"
      className="flex min-h-14 items-center gap-3 rounded-xl px-1 py-2 transition-opacity active:opacity-70"
    >
      <span
        className="material-symbols-outlined text-3xl text-amber-500"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        stars
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Puntos ClubPlaza</span>
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
            {data.saldo.toLocaleString('es-AR')}
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">puntos</span>
        </span>
      </span>
      {data.promocion_activa && (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          Hoy x{data.promocion_activa.multiplicador}
        </span>
      )}
      <span className="material-symbols-outlined text-slate-400">chevron_right</span>
    </Link>
  )
}
