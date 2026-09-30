'use client'

import { useEffect, useState } from 'react'
import { getCantinasCaja, type CantinaCaja } from '@/lib/api'
import CajaHistorial from '@/components/cantina/CajaHistorial'
import { useAuthStore } from '@/stores/authStore'

// Selected cantina chip ('' = Todas), stored per logged-in user
function selectionKey(): string {
  const userId = useAuthStore.getState().user?.id
  return `caja-cantina:${userId ? String(userId) : 'anon'}`
}

export default function CajasClubView() {
  const [cantinas, setCantinas] = useState<CantinaCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storedSelected, setStoredSelected] = useState('')

  // Read after mount to avoid hydration mismatches; only written on user click
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(selectionKey())
      if (typeof v === 'string') setStoredSelected(v)
    } catch {
      // Storage unavailable: keep the default
    }
  }, [])

  // If the stored cantina no longer exists, fall back to Todas
  const selected = cantinas.some((c) => c.id === storedSelected) ? storedSelected : ''

  const select = (id: string) => {
    setStoredSelected(id)
    try {
      window.localStorage.setItem(selectionKey(), id)
    } catch {
      // Best-effort persistence
    }
  }

  useEffect(() => {
    let cancelled = false
    getCantinasCaja()
      .then((list) => {
        if (!cancelled) setCantinas(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No pudimos cargar las cantinas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const chipClass = (active: boolean) =>
    `min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cajas de las cantinas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Mirá las ventas de cada cantina por separado o de todas juntas.
        </p>
      </div>

      {loading ? (
        <div className="flex gap-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : cantinas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">storefront</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Todavía no hay cantinas en el club</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir cantina">
            <button type="button" onClick={() => select('')} aria-pressed={selected === ''} className={chipClass(selected === '')}>
              Todas
            </button>
            {cantinas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c.id)}
                aria-pressed={selected === c.id}
                className={chipClass(selected === c.id)}
              >
                {c.nombre}
                {!c.activo && ' (inactiva)'}
              </button>
            ))}
          </div>
          <CajaHistorial cantinaId={selected || undefined} showCantina={!selected} />
        </>
      )}
    </div>
  )
}
