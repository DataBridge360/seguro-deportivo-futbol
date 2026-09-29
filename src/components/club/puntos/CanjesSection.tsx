'use client'

import { useCallback, useEffect, useState } from 'react'
import { anularPuntosCanje, getPuntosCanjesClub, type PuntosCanje, type PuntosCanjeEstado } from '@/lib/api'
import { ConfirmModal, ErrorNote, Spinner, cardCls, errMsg, fmt, formatDateTime, secondaryBtnCls } from './ui'

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

export default function CanjesSection() {
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
      setAnulando(null)
    } catch (e) {
      setAnularError(errMsg(e, 'No pudimos anular el canje.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar canjes">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            aria-pressed={estado === f.value}
            onClick={() => changeFilter(f.value)}
            className={`h-11 rounded-full border-2 px-5 text-base font-semibold ${
              estado === f.value
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : error && items.length === 0 ? (
        <ErrorNote message={error} />
      ) : items.length === 0 ? (
        <p className={`${cardCls} text-center text-base text-slate-500 dark:text-slate-400`}>
          No hay canjes en este estado.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(c => (
            <li key={c.id} className={`${cardCls} space-y-2`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-extrabold tracking-wider text-slate-900 dark:text-white">{c.codigo}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_CLS[c.estado]}`}>
                  {ESTADO_LABEL[c.estado]}
                </span>
              </div>
              <p className="text-base font-medium text-slate-800 dark:text-slate-100">
                {c.recompensa?.titulo ?? 'Recompensa eliminada'} · {fmt(c.costo_puntos)} puntos
              </p>
              <p className="text-base text-slate-600 dark:text-slate-300">
                {c.jugador ? `${c.jugador.nombre} ${c.jugador.apellido}` : 'Jugador'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(c.created_at)}</p>
              {c.estado === 'pendiente' && (
                <button
                  type="button"
                  onClick={() => {
                    setAnularError('')
                    setAnulando(c)
                  }}
                  className={`${secondaryBtnCls} w-full sm:w-auto`}
                >
                  <span className="material-symbols-outlined">block</span>
                  Anular
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && items.length > 0 && <ErrorNote message={error} />}

      {items.length < total && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className={`${secondaryBtnCls} w-full`}>
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
