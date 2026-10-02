'use client'

import { useCallback, useEffect, useState } from 'react'
import { anularPuntosCanje, getPuntosCanjesClub, type PuntosCanje, type PuntosCanjeEstado } from '@/lib/api'
import {
  ConfirmModal,
  EmptyState,
  ErrorNote,
  ListSkeleton,
  Spinner,
  cardCls,
  compactSecondaryBtnCls,
  errMsg,
  fmt,
  formatDateTime,
} from './ui'

const LIMIT = 20
const FILTERS: { value: PuntosCanjeEstado; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'entregado', label: 'Entregados' },
  { value: 'anulado', label: 'Anulados' },
]
const ESTADO_LABEL: Record<PuntosCanjeEstado, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  anulado: 'Anulado',
}
const ESTADO_CLS: Record<PuntosCanjeEstado, string> = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  entregado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  anulado: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}
const EMPTY: Record<PuntosCanjeEstado, { icon: string; title: string; hint: string }> = {
  pendiente: {
    icon: 'inbox',
    title: 'No hay canjes pendientes',
    hint: 'Cuando un jugador canjee una recompensa, aparece acá hasta que la cantina se la entregue.',
  },
  entregado: { icon: 'task_alt', title: 'Todavía no se entregó ningún canje', hint: '' },
  anulado: { icon: 'block', title: 'No hay canjes anulados', hint: '' },
}

export default function CanjesSection({
  onPendientesChange,
}: {
  onPendientesChange?: (total: number) => void
}) {
  const [estado, setEstado] = useState<PuntosCanjeEstado>('pendiente')
  const [items, setItems] = useState<PuntosCanje[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [anulando, setAnulando] = useState<PuntosCanje | null>(null)
  const [busy, setBusy] = useState(false)
  const [anularError, setAnularError] = useState('')

  useEffect(() => {
    let active = true
    getPuntosCanjesClub(estado, 1, LIMIT)
      .then(res => {
        if (!active) return
        setItems(res.data)
        setTotal(res.total)
        if (estado === 'pendiente') onPendientesChange?.(res.total)
        setPage(1)
        setError('')
      })
      .catch(e => {
        if (active) setError(errMsg(e, 'No pudimos cargar los canjes.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [estado])

  const changeFilter = (value: PuntosCanjeEstado) => {
    if (value === estado) return
    setLoading(true)
    setItems([])
    setEstado(value)
  }

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    setError('')
    try {
      const res = await getPuntosCanjesClub(estado, page + 1, LIMIT)
      setItems(prev => [...prev, ...res.data])
      setTotal(res.total)
      setPage(page + 1)
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar más canjes.'))
    } finally {
      setLoadingMore(false)
    }
  }, [estado, page])

  const confirmAnular = async () => {
    if (!anulando) return
    setBusy(true)
    setAnularError('')
    try {
      await anularPuntosCanje(anulando.id)
      const id = anulando.id
      setItems(prev => prev.filter(c => c.id !== id))
      setTotal(t => Math.max(0, t - 1))
      if (estado === 'pendiente') onPendientesChange?.(Math.max(0, total - 1))
      setAnulando(null)
    } catch (e) {
      setAnularError(errMsg(e, 'No pudimos anular el canje.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div
        className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        role="group"
        aria-label="Filtrar canjes"
      >
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            aria-pressed={estado === f.value}
            onClick={() => changeFilter(f.value)}
            className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${
              estado === f.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton className="h-28" />
      ) : error && items.length === 0 ? (
        <ErrorNote message={error} />
      ) : items.length === 0 ? (
        <EmptyState icon={EMPTY[estado].icon} title={EMPTY[estado].title} hint={EMPTY[estado].hint || undefined} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map(c => (
            <li key={c.id} className={`${cardCls} flex flex-col gap-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Código</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-slate-900 dark:text-white">{c.codigo}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_CLS[c.estado]}`}>
                  {ESTADO_LABEL[c.estado]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {c.recompensa?.titulo ?? 'Recompensa eliminada'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {c.jugador ? `${c.jugador.nombre} ${c.jugador.apellido}` : 'Jugador'} ·{' '}
                  <span className="font-semibold text-primary">{fmt(c.costo_puntos)} puntos</span>
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(c.created_at)}</p>
                {c.estado === 'pendiente' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnularError('')
                      setAnulando(c)
                    }}
                    className={`${compactSecondaryBtnCls} px-3`}
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden>
                      block
                    </span>
                    Anular
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && items.length > 0 && <ErrorNote message={error} />}

      {items.length < total && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className={`${compactSecondaryBtnCls} w-full`}>
          {loadingMore && <Spinner />}
          Ver más
        </button>
      )}

      {anulando && (
        <ConfirmModal
          title="Anular canje"
          message={`¿Anular el canje ${anulando.codigo}? Se le devuelven ${fmt(anulando.costo_puntos)} puntos a ${
            anulando.jugador ? `${anulando.jugador.nombre} ${anulando.jugador.apellido}` : 'el jugador'
          }.`}
          confirmLabel="Anular canje"
          busy={busy}
          error={anularError}
          onConfirm={confirmAnular}
          onClose={() => setAnulando(null)}
        />
      )}
    </section>
  )
}
