'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  CANJE_ESTADO_LABEL,
  MOVIMIENTO_LABEL,
  getCanjesJugadorClub,
  getComprasJugadorClub,
  getMovimientosJugadorClub,
  getResumenJugadorClub,
  type CanjeJugador,
  type CompraConCobrador,
  type EstadoCanje,
  type MovimientoJugador,
  type ResumenJugadorClub,
} from '@/lib/contabilidadClub'

const PAGE_SIZE = 20

const moneyFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const money = (n: number) => moneyFmt.format(Number(n) || 0)
const num = (n: number) => (Number(n) || 0).toLocaleString('es-AR')

function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

const cardCls = 'rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10'

// ---------- Paginated list state shared by the three tabs ----------

interface PagedState<T> {
  items: T[]
  total: number
  loading: boolean
  loadingMore: boolean
  error: string | null
  loadMore: () => void
  retry: () => void
}

function usePaged<T>(fetchPage: (offset: number, limit: number) => Promise<{ items: T[]; total: number }>): PagedState<T> {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage
  const aliveRef = useRef(true)
  const itemsRef = useRef<T[]>([])

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const run = useCallback(async (first: boolean) => {
    if (first) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const res = await fetchRef.current(first ? 0 : itemsRef.current.length, PAGE_SIZE)
      if (!aliveRef.current) return
      itemsRef.current = first ? res.items : [...itemsRef.current, ...res.items]
      setItems(itemsRef.current)
      setTotal(res.total)
    } catch (err) {
      if (!aliveRef.current) return
      setError(err instanceof Error && err.message ? err.message : 'No pudimos cargar los datos')
    } finally {
      if (aliveRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    void run(true)
  }, [run])

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    loadMore: () => void run(false),
    retry: () => void run(itemsRef.current.length === 0),
  }
}

// ---------- Small UI pieces ----------

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/60 ${className}`} />
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-red-50 p-4 text-center dark:bg-red-500/10">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition active:scale-[0.98] dark:bg-slate-800 dark:text-slate-100 dark:ring-white/10"
      >
        Reintentar
      </button>
    </div>
  )
}

function Empty({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-600">
      <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500" aria-hidden>
        {icon}
      </span>
      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
    </div>
  )
}

function PagedList<T>({
  state,
  emptyIcon,
  emptyTitle,
  render,
}: {
  state: PagedState<T>
  emptyIcon: string
  emptyTitle: string
  render: (item: T) => ReactNode
}) {
  if (state.loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }
  if (state.error && state.items.length === 0) return <ErrorRetry message={state.error} onRetry={state.retry} />
  if (state.items.length === 0) return <Empty icon={emptyIcon} title={emptyTitle} />
  return (
    <div className="space-y-2">
      <ul className="space-y-2">{state.items.map(render)}</ul>
      {state.error && <ErrorRetry message={state.error} onRetry={state.retry} />}
      {!state.error && state.items.length < state.total && (
        <button
          type="button"
          onClick={state.loadMore}
          disabled={state.loadingMore}
          className="min-h-12 w-full rounded-2xl bg-white text-sm font-semibold text-primary ring-1 ring-slate-200/70 transition active:scale-[0.98] disabled:opacity-60 dark:bg-slate-800 dark:ring-white/10"
        >
          {state.loadingMore ? 'Cargando...' : `Ver más (${state.total - state.items.length})`}
        </button>
      )}
    </div>
  )
}

// ---------- Summary ----------

interface StatProps {
  icon: string
  label: string
  value: string
  tone: string
  toneBg: string
}

function Stat({ icon, label, value, tone, toneBg }: StatProps) {
  return (
    <div className={`${cardCls} flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <span className={`flex size-8 items-center justify-center rounded-lg ${toneBg}`}>
          <span className={`material-symbols-outlined text-xl ${tone}`} aria-hidden>
            {icon}
          </span>
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="break-words text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function Resumen({ jugadorId }: { jugadorId: string }) {
  const [data, setData] = useState<ResumenJugadorClub | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setData(null)
    getResumenJugadorClub(jugadorId)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error && err.message ? err.message : 'No pudimos cargar el resumen')
      })
    return () => {
      cancelled = true
    }
  }, [jugadorId, attempt])

  if (error) return <ErrorRetry message={error} onRetry={() => setAttempt((a) => a + 1)} />
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat icon="stars" label="Saldo de puntos" value={num(data.saldo)} tone="text-amber-500" toneBg="bg-amber-500/10" />
      <Stat icon="payments" label="Total gastado" value={money(data.total_gastado)} tone="text-green-500" toneBg="bg-green-500/10" />
      <Stat icon="sell" label="Descuentos" value={money(data.total_descuentos)} tone="text-red-500" toneBg="bg-red-500/10" />
      <Stat icon="shopping_cart" label="Compras" value={num(data.total_compras)} tone="text-indigo-500" toneBg="bg-indigo-500/10" />
      <Stat icon="trending_up" label="Puntos ganados" value={num(data.puntos_ganados)} tone="text-emerald-500" toneBg="bg-emerald-500/10" />
      <Stat icon="redeem" label="Puntos canjeados" value={num(data.puntos_canjeados)} tone="text-purple-500" toneBg="bg-purple-500/10" />
      <Stat icon="hourglass_top" label="Canjes pendientes" value={num(data.canjes_pendientes)} tone="text-sky-500" toneBg="bg-sky-500/10" />
    </div>
  )
}

// ---------- Tabs ----------

function ComprasTab({ jugadorId }: { jugadorId: string }) {
  const state = usePaged<CompraConCobrador>(async (offset, limit) => {
    const res = await getComprasJugadorClub(jugadorId, offset, limit)
    return { items: res.items, total: res.total_count }
  })
  return (
    <PagedList
      state={state}
      emptyIcon="receipt_long"
      emptyTitle="Todavía no hizo compras"
      render={(c) => (
        <li key={c.id} className={cardCls}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatFechaHora(c.created_at)}</p>
              {c.cantina?.nombre && <p className="truncate text-sm font-semibold text-primary">{c.cantina.nombre}</p>}
            </div>
            <p className="shrink-0 text-lg font-bold text-slate-900 dark:text-white">{money(c.monto_total)}</p>
          </div>
          {(c.monto_descuento > 0 || c.cupon || c.puntos_acreditados > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {c.monto_descuento > 0 && (
                <span className="inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500 dark:text-red-400">
                  -{money(c.monto_descuento)}
                </span>
              )}
              {c.cupon && (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                  Cupón: {c.cupon.titulo}
                </span>
              )}
              {c.puntos_acreditados > 0 && (
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  +{num(c.puntos_acreditados)} pts
                </span>
              )}
            </div>
          )}
          {c.creado_por?.nombre && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Cobrado por {c.creado_por.nombre}</p>
          )}
        </li>
      )}
    />
  )
}

function PuntosTab({ jugadorId }: { jugadorId: string }) {
  const state = usePaged<MovimientoJugador>(async (offset, limit) => {
    const res = await getMovimientosJugadorClub(jugadorId, Math.floor(offset / limit) + 1, limit)
    return { items: res.data, total: res.total }
  })
  return (
    <PagedList
      state={state}
      emptyIcon="stars"
      emptyTitle="Todavía no tiene movimientos de puntos"
      render={(m) => {
        const positivo = m.puntos >= 0
        return (
          <li key={m.id} className={`${cardCls} flex items-center justify-between gap-3`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {MOVIMIENTO_LABEL[m.tipo] ?? m.tipo}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{formatFechaHora(m.created_at)}</p>
              {m.descripcion && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{m.descripcion}</p>}
            </div>
            <p
              className={`shrink-0 text-lg font-bold ${
                positivo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {positivo ? '+' : '−'}
              {num(Math.abs(m.puntos))}
            </p>
          </li>
        )
      }}
    />
  )
}

const ESTADO_BADGE: Record<EstadoCanje, string> = {
  pendiente: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  entregado: 'bg-green-500/10 text-green-600 dark:text-green-400',
  anulado: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
}

function RecompensasTab({ jugadorId }: { jugadorId: string }) {
  const state = usePaged<CanjeJugador>(async (offset, limit) => {
    const res = await getCanjesJugadorClub(jugadorId, Math.floor(offset / limit) + 1, limit)
    return { items: res.data, total: res.total }
  })
  return (
    <PagedList
      state={state}
      emptyIcon="redeem"
      emptyTitle="Todavía no canjeó recompensas"
      render={(c) => (
        <li key={c.id} className={`${cardCls} flex items-center justify-between gap-3`}>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {c.recompensa?.titulo ?? 'Recompensa'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatFechaHora(c.created_at)} · {num(c.costo_puntos)} pts
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_BADGE[c.estado] ?? ESTADO_BADGE.anulado}`}>
            {CANJE_ESTADO_LABEL[c.estado] ?? c.estado}
          </span>
        </li>
      )}
    />
  )
}

type Tab = 'compras' | 'puntos' | 'recompensas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'compras', label: 'Compras' },
  { id: 'puntos', label: 'Puntos' },
  { id: 'recompensas', label: 'Recompensas' },
]

// ---------- Sheet ----------

interface Props {
  jugador: { id: string; nombre_completo: string; dni: string }
  onClose: () => void
}

export default function JugadorHistorialSheet({ jugador, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('compras')
  // Tabs mount on first visit and stay mounted, so switching back keeps the loaded pages
  const [visited, setVisited] = useState<Tab[]>(['compras'])
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [])

  const selectTab = (next: Tab) => {
    setTab(next)
    setVisited((v) => (v.includes(next) ? v : [...v, next]))
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/50 sm:flex sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Historial de ${jugador.nombre_completo}`}
        className="flex h-dvh w-full flex-col bg-slate-50 dark:bg-slate-900 sm:h-auto sm:max-h-[90dvh] sm:max-w-2xl sm:overflow-hidden sm:rounded-2xl sm:shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            aria-label="Volver"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{jugador.nombre_completo}</h2>
            <p className="font-mono text-xs text-slate-500 dark:text-slate-400">DNI {jugador.dni}</p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Resumen jugadorId={jugador.id} />

          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Historial">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => selectTab(t.id)}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {visited.includes('compras') && (
              <div hidden={tab !== 'compras'}>
                <ComprasTab jugadorId={jugador.id} />
              </div>
            )}
            {visited.includes('puntos') && (
              <div hidden={tab !== 'puntos'}>
                <PuntosTab jugadorId={jugador.id} />
              </div>
            )}
            {visited.includes('recompensas') && (
              <div hidden={tab !== 'recompensas'}>
                <RecompensasTab jugadorId={jugador.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
