'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  actualizarPuntosPromocion,
  crearPuntosPromocion,
  eliminarPuntosPromocion,
  getPuntosPromociones,
  getPuntosPromocionActiva,
  type PuntosPromocion,
  type PuntosPromocionActiva,
} from '@/lib/api'
import DatePicker from '@/components/ui/DatePicker'
import {
  ConfirmModal,
  ErrorNote,
  Modal,
  Pill,
  Spinner,
  Toggle,
  cardCls,
  errMsg,
  formatDate,
  inputCls,
  labelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './ui'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const QUICK = [2, 3]

const fmtMult = (n: number) => `x${String(Number(n.toFixed(2))).replace('.', ',')}`

function rangeText(p: PuntosPromocion): string {
  if (p.fecha_desde && p.fecha_hasta) return `Del ${formatDate(p.fecha_desde)} al ${formatDate(p.fecha_hasta)}`
  if (p.fecha_desde) return `Desde el ${formatDate(p.fecha_desde)}`
  if (p.fecha_hasta) return `Hasta el ${formatDate(p.fecha_hasta)}`
  return 'Sin fechas límite'
}

function DayChips({ days }: { days: number[] | null }) {
  if (!days || days.length === 0) {
    return <span className="text-sm text-slate-600 dark:text-slate-300">Todos los días</span>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {[...days].sort().map(d => (
        <span
          key={d}
          className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
        >
          {DAYS[d]}
        </span>
      ))}
    </div>
  )
}

function PromocionModal({
  item,
  onClose,
  onSaved,
}: {
  item: PuntosPromocion | null
  onClose: () => void
  onSaved: () => void
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? '')
  const [mult, setMult] = useState(item ? String(item.multiplicador).replace('.', ',') : '2')
  const [days, setDays] = useState<number[]>(item?.dias_semana ?? [])
  const [desde, setDesde] = useState(item?.fecha_desde?.slice(0, 10) ?? '')
  const [hasta, setHasta] = useState(item?.fecha_hasta?.slice(0, 10) ?? '')
  const [activo, setActivo] = useState(item?.activo ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const multNum = Number(mult.trim().replace(',', '.'))

  const toggleDay = (d: number) =>
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()))

  const save = async () => {
    const name = titulo.trim()
    if (!name) return setError('Ingresá un título para la promoción.')
    if (name.length > 80) return setError('El título admite hasta 80 caracteres.')
    if (!/^\d+([.,]\d+)?$/.test(mult.trim()) || !Number.isFinite(multNum)) {
      return setError('Ingresá un multiplicador válido.')
    }
    if (multNum <= 1 || multNum > 10) return setError('El multiplicador debe ser mayor a 1 y hasta 10.')
    if (Math.round(multNum * 100) / 100 !== multNum) return setError('El multiplicador admite hasta 2 decimales.')
    if (desde && hasta && hasta < desde) return setError('La fecha "hasta" no puede ser anterior a "desde".')
    setError('')
    setSaving(true)
    try {
      if (item) {
        await actualizarPuntosPromocion(item.id, {
          titulo: name,
          multiplicador: multNum,
          dias_semana: days.length ? days : null,
          fecha_desde: desde || null,
          fecha_hasta: hasta || null,
          activo,
        })
      } else {
        await crearPuntosPromocion({
          titulo: name,
          multiplicador: multNum,
          dias_semana: days.length ? days : undefined,
          fecha_desde: desde || undefined,
          fecha_hasta: hasta || undefined,
          activo,
        })
      }
      onSaved()
    } catch (e) {
      setError(errMsg(e, 'No pudimos guardar la promoción.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={item ? 'Editar promoción' : 'Nueva promoción'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnCls}>
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving} className={primaryBtnCls}>
            {saving && <Spinner />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="promo-titulo" className={labelCls}>
          Título
        </label>
        <input
          id="promo-titulo"
          value={titulo}
          maxLength={80}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Ej: Martes de puntos dobles"
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>Multiplicador</span>
        <div className="flex flex-wrap items-center gap-2">
          {QUICK.map(q => (
            <button
              key={q}
              type="button"
              aria-pressed={multNum === q}
              onClick={() => setMult(String(q))}
              className={`h-11 min-w-16 rounded-xl border-2 px-4 text-base font-bold ${
                multNum === q
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200'
              }`}
            >
              x{q}
            </button>
          ))}
          <input
            aria-label="Otro multiplicador"
            inputMode="decimal"
            value={mult}
            onChange={e => setMult(e.target.value)}
            placeholder="Otro"
            className={`${inputCls} !w-28`}
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>Días</span>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((label, d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(d)}
              onClick={() => toggleDay(d)}
              className={`h-11 min-w-14 rounded-xl border-2 px-3 text-base font-semibold ${
                days.includes(d)
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-200 text-slate-700 dark:border-slate-600 dark:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Si no elegís ninguno, vale todos los días.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className={labelCls}>Desde (opcional)</span>
          <DatePicker value={desde} onChange={setDesde} size="lg" />
        </div>
        <div>
          <span className={labelCls}>Hasta (opcional)</span>
          <DatePicker value={hasta} onChange={setHasta} size="lg" />
        </div>
      </div>

      <Toggle checked={activo} onChange={setActivo} label="Promoción activa" />
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function PromocionesSection() {
  const [items, setItems] = useState<PuntosPromocion[]>([])
  const [active, setActive] = useState<PuntosPromocionActiva | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState<PuntosPromocion | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PuntosPromocion | null>(null)
  const [delBusy, setDelBusy] = useState(false)
  const [delError, setDelError] = useState('')

  const load = useCallback(async () => {
    try {
      const [list, act] = await Promise.all([getPuntosPromociones(), getPuntosPromocionActiva()])
      setItems(list)
      setActive(act)
      setLoadError('')
    } catch (e) {
      setLoadError(errMsg(e, 'No pudimos cargar las promociones.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleting) return
    setDelBusy(true)
    setDelError('')
    try {
      await eliminarPuntosPromocion(deleting.id)
      setDeleting(null)
      await load()
    } catch (e) {
      setDelError(errMsg(e, 'No pudimos eliminar la promoción.'))
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-slate-500 dark:text-slate-400">
          Multiplicá los puntos que suman las compras en días o fechas especiales.
        </p>
        <button type="button" onClick={() => setEditing('new')} className={`${primaryBtnCls} w-full sm:w-auto`}>
          <span className="material-symbols-outlined">add</span>
          Nueva promoción
        </button>
      </div>

      {active && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-base font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <span className="material-symbols-outlined">bolt</span>
          Hoy rige: {active.titulo} ({fmtMult(active.multiplicador)})
        </p>
      )}

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : loadError ? (
        <ErrorNote message={loadError} />
      ) : items.length === 0 ? (
        <p className={`${cardCls} text-center text-base text-slate-500 dark:text-slate-400`}>
          Todavía no creaste promociones.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(p => {
            const isToday = active?.id === p.id
            return (
              <li
                key={p.id}
                className={`${cardCls} space-y-3 ${isToday ? '!border-amber-400 ring-2 ring-amber-300/60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-12 min-w-14 shrink-0 items-center justify-center rounded-xl bg-primary px-2 text-lg font-extrabold text-white">
                    {fmtMult(p.multiplicador)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{p.titulo}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{rangeText(p)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Pill active={p.activo} />
                    {isToday && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        Rige hoy
                      </span>
                    )}
                  </div>
                </div>
                <DayChips days={p.dias_semana} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className={`${secondaryBtnCls} flex-1`}
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Editar
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${p.titulo}`}
                    onClick={() => {
                      setDelError('')
                      setDeleting(p)
                    }}
                    className="flex size-12 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && (
        <PromocionModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Eliminar promoción"
          message={`¿Eliminar la promoción "${deleting.titulo}"? Las compras futuras ya no van a usarla.`}
          confirmLabel="Eliminar"
          busy={delBusy}
          error={delError}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}
