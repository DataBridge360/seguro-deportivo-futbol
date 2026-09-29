'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMisMovimientosPuntos, getMiSaldoPuntos, type PuntosMovimiento, type PuntosMovimientoTipo } from '@/lib/api'
import { errMsg, fmt } from '@/components/club/puntos/ui'

const PAGE_SIZE = 20

const TIPO_META: Record<PuntosMovimientoTipo, { icon: string; cls: string }> = {
  compra: { icon: 'shopping_bag', cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  canje: { icon: 'redeem', cls: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300' },
  apoyo: { icon: 'favorite', cls: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
  anulacion: { icon: 'undo', cls: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  ajuste: { icon: 'tune', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
}

function labelFor(m: PuntosMovimiento): string {
  switch (m.tipo) {
    case 'compra':
      return 'Compra en la cantina'
    case 'canje':
      return m.descripcion ? `Canje: ${m.descripcion}` : 'Canje de recompensa'
    case 'apoyo':
      return 'Apoyo a equipo'
    case 'anulacion':
      return 'Canje anulado'
    default:
      return 'Ajuste'
  }
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(d: Date): string {
  const now = new Date()
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (dayKey(d) === dayKey(now)) return 'Hoy'
  if (dayKey(d) === dayKey(yesterday)) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function HistorialList() {
  const [saldo, setSaldo] = useState<number | null>(null)
  const [movs, setMovs] = useState<PuntosMovimiento[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, m] = await Promise.all([getMiSaldoPuntos(), getMisMovimientosPuntos(1, PAGE_SIZE)])
      setSaldo(s.saldo)
      setMovs(m.data)
      setTotal(m.total)
      setPage(1)
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar tu historial.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = async () => {
    setLoadingMore(true)
    setError('')
    try {
      const m = await getMisMovimientosPuntos(page + 1, PAGE_SIZE)
      setMovs(prev => [...prev, ...m.data])
      setTotal(m.total)
      setPage(page + 1)
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar más movimientos.'))
    } finally {
      setLoadingMore(false)
    }
  }

  const groups = useMemo(() => {
    const out: { key: string; label: string; items: { m: PuntosMovimiento; time: string }[] }[] = []
    for (const m of movs) {
      const d = new Date(m.created_at)
      if (Number.isNaN(d.getTime())) continue
      const key = dayKey(d)
      let g = out[out.length - 1]
      if (!g || g.key !== key) {
        g = { key, label: dayLabel(d), items: [] }
        out.push(g)
      }
      g.items.push({ m, time: formatTime(d) })
    }
    return out
  }, [movs])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Historial</h1>
        {saldo !== null && (
          <span className="rounded-full bg-sky-100 px-4 py-2 text-base font-extrabold text-primary dark:bg-primary/25 dark:text-sky-200">
            Saldo: {fmt(saldo)}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={movs.length ? loadMore : load} className="h-11 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : groups.length === 0 && !error ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
          Todavía no tenés movimientos
        </p>
      ) : (
        <div>
          {groups.map(g => (
            <section key={g.key}>
              <h2 className="sticky top-0 z-10 bg-background-light py-2 text-sm font-bold capitalize text-slate-600 dark:bg-background-dark dark:text-slate-300 md:top-24">
                {g.label}
              </h2>
              <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
                {g.items.map(({ m, time }, i) => {
                  const meta = TIPO_META[m.tipo] ?? TIPO_META.ajuste
                  const positive = m.puntos >= 0
                  return (
                    <li key={`${m.created_at}-${i}`} className="flex items-center gap-3 p-3">
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                        <span className="material-symbols-outlined" aria-hidden>
                          {meta.icon}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{labelFor(m)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {time}
                          {m.tipo === 'compra' && m.monto_compra !== null && ` · Compra de $${fmt(m.monto_compra)}`}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-lg font-bold ${
                          positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {positive ? '+' : '−'}
                        {fmt(Math.abs(m.puntos))}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && movs.length < total && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {loadingMore ? 'Cargando...' : 'Ver más'}
        </button>
      )}
    </div>
  )
}
