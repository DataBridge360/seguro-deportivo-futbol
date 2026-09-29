'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  anularMiCanjePuntos,
  getMisCanjesPuntos,
  type MiCanjePuntos,
  type PuntosCanjeEstado,
} from '@/lib/api'
import { ErrorNote, Modal, Spinner, dangerBtnCls, errMsg, fmt, formatDateTime, secondaryBtnCls } from '@/components/club/puntos/ui'
import CanjeQr from './CanjeQr'
import RewardImage from './RewardImage'

type Filter = PuntosCanjeEstado | 'todos'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'anulado', label: 'Anulados' },
  { key: 'todos', label: 'Todos' },
]

const ESTADO_META: Record<PuntosCanjeEstado, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  entregado: { label: 'Entregado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  anulado: { label: 'Anulado', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
}

function CanjeModal({
  canje,
  onClose,
  onAnulado,
}: {
  canje: MiCanjePuntos
  onClose: () => void
  onAnulado: (puntos: number) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const anular = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await anularMiCanjePuntos(canje.id)
      onAnulado(res.puntos_devueltos)
    } catch (e) {
      setError(errMsg(e, 'No pudimos anular el canje.'))
      setBusy(false)
    }
  }

  return (
    <Modal
      title={confirming ? 'Anular canje' : 'Tu canje'}
      onClose={onClose}
      busy={busy}
      footer={
        confirming ? (
          <>
            <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={secondaryBtnCls}>
              Volver
            </button>
            <button type="button" onClick={anular} disabled={busy} className={dangerBtnCls}>
              {busy && <Spinner />}
              Anular canje
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} className={secondaryBtnCls}>
              Cerrar
            </button>
            <button type="button" onClick={() => setConfirming(true)} className={dangerBtnCls}>
              Anular canje
            </button>
          </>
        )
      }
    >
      {confirming ? (
        <p className="text-base text-slate-700 dark:text-slate-200">
          ¿Querés anular el canje de <span className="font-bold">{canje.recompensa?.titulo ?? 'la recompensa'}</span>? Se
          te devuelven {fmt(canje.costo_puntos)} puntos.
        </p>
      ) : (
        <>
          <p className="text-center text-lg font-bold text-slate-900 dark:text-white">
            {canje.recompensa?.titulo ?? 'Recompensa'}
          </p>
          <CanjeQr codigo={canje.codigo} />
        </>
      )}
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function CanjesList() {
  const [filter, setFilter] = useState<Filter>('pendiente')
  const [items, setItems] = useState<MiCanjePuntos[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<MiCanjePuntos | null>(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async (f: Filter) => {
    setLoading(true)
    setError('')
    try {
      setItems(await getMisCanjesPuntos(f === 'todos' ? undefined : f))
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar tus canjes.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [load, filter])

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis canjes</h1>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1" role="group" aria-label="Filtrar canjes">
        {FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => {
              setNotice('')
              setFilter(f.key)
            }}
            className={`h-11 shrink-0 rounded-full px-5 text-base font-semibold transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-base text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </p>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => load(filter)} className="h-11 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 && !error ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
          {filter === 'pendiente' ? 'No tenés canjes pendientes' : 'No hay canjes para mostrar'}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(c => {
            const meta = ESTADO_META[c.estado] ?? ESTADO_META.anulado
            const pending = c.estado === 'pendiente'
            const body = (
              <>
                <RewardImage src={c.recompensa?.imagen_url} alt={c.recompensa?.titulo ?? ''} className="size-20 rounded-xl" iconClass="text-3xl" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{c.recompensa?.titulo ?? 'Recompensa'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(c.created_at)}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                </div>
                {pending && (
                  <span className="material-symbols-outlined text-slate-400" aria-hidden>
                    qr_code_2
                  </span>
                )}
              </>
            )
            const cls =
              'flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800'
            return (
              <li key={c.id}>
                {pending ? (
                  <button type="button" onClick={() => setSelected(c)} className={`${cls} hover:bg-slate-50 dark:hover:bg-slate-700/60`}>
                    {body}
                  </button>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <CanjeModal
          canje={selected}
          onClose={() => setSelected(null)}
          onAnulado={puntos => {
            setSelected(null)
            setNotice(`Canje anulado. Se te devolvieron ${fmt(puntos)} puntos.`)
            load(filter)
          }}
        />
      )}
    </div>
  )
}
