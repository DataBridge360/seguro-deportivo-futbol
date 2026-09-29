'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getMiSaldoPuntos,
  getMisMovimientosPuntos,
  type MiSaldoPuntosResponse,
  type PuntosMovimiento,
  type PuntosMovimientoTipo,
} from '@/lib/api'
import { formatDateOnly } from '@/lib/utils'

const PAGE_SIZE = 20

const fmt = (n: number) => n.toLocaleString('es-AR')

const TIPO_META: Record<PuntosMovimientoTipo, { icon: string; label: string }> = {
  compra: { icon: 'shopping_bag', label: 'Compra en cantina' },
  canje: { icon: 'redeem', label: 'Canje de recompensa' },
  apoyo: { icon: 'favorite', label: 'Apoyo a equipo' },
  anulacion: { icon: 'undo', label: 'Devolución' },
  ajuste: { icon: 'tune', label: 'Ajuste' },
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function PuntosPage() {
  const [saldo, setSaldo] = useState<MiSaldoPuntosResponse | null>(null)
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
      setSaldo(s)
      setMovs(m.data)
      setTotal(m.total)
      setPage(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar tus puntos.')
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
      setError(e instanceof Error ? e.message : 'No pudimos cargar más movimientos.')
    } finally {
      setLoadingMore(false)
    }
  }

  const cfg = saldo?.config && saldo.config.activo ? saldo.config : null

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos</h1>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={saldo ? loadMore : load}
            className="h-11 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b3a63] to-[#1392ec] p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
          </div>
          <div>
            <p className="text-base text-white/80">Tu saldo</p>
            {loading ? (
              <div className="mt-1 h-10 w-40 animate-pulse rounded-lg bg-white/20" />
            ) : (
              <p className="text-4xl font-extrabold leading-tight">
                {fmt(saldo?.saldo ?? 0)} <span className="text-2xl font-bold">puntos</span>
              </p>
            )}
          </div>
        </div>
        {!loading && (
          <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-base text-white/90 backdrop-blur">
            {cfg
              ? `Cada $${fmt(cfg.monto_base)} de compra en la cantina suman ${fmt(cfg.puntos)} puntos`
              : 'El club todavía no activó los puntos'}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <span className="material-symbols-outlined text-primary dark:text-sky-300">help</span>
        <div>
          <p className="text-base font-semibold text-slate-900 dark:text-white">¿Cómo sumo puntos?</p>
          <p className="text-base text-slate-600 dark:text-slate-300">Mostrá tu cupón o decí tu DNI al pagar en la cantina.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-600">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">redeem</span>
        <p className="text-base text-slate-600 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">Recompensas</span> — Próximamente
        </p>
      </div>

      {/* History */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial</h2>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : movs.length === 0 && !error ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-base text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Todavía no tenés movimientos
          </p>
        ) : (
          <ul className="space-y-2">
            {movs.map((m, i) => {
              const meta = TIPO_META[m.tipo] ?? TIPO_META.ajuste
              const positive = m.puntos >= 0
              return (
                <li
                  key={`${m.created_at}-${i}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300">
                    <span className="material-symbols-outlined">{meta.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-slate-900 dark:text-white">{meta.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateOnly(m.created_at)} {formatTime(m.created_at)}
                      {m.monto_compra !== null && ` · $${fmt(m.monto_compra)}`}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-lg font-bold ${
                      positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {positive ? '+' : '−'}
                    {fmt(Math.abs(m.puntos))}
                  </p>
                </li>
              )
            })}
          </ul>
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
      </section>
    </div>
  )
}
