'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  actualizarPuntosCompetencia,
  crearPuntosCompetencia,
  eliminarPuntosCompetencia,
  getPuntosCompetencias,
  type CompetenciasTorneo,
  type EstadoCompetencia,
  type PuntosCompetencia,
} from '@/lib/api'
import DatePicker from '@/components/ui/DatePicker'
import {
  ConfirmModal,
  ErrorNote,
  Modal,
  Spinner,
  Toggle,
  cardCls,
  errMsg,
  formatDate,
  labelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './ui'

const ESTADO_LABEL: Record<EstadoCompetencia, string> = {
  programada: 'Programada',
  abierta: 'En curso',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
}

const ESTADO_CLS: Record<EstadoCompetencia, string> = {
  programada: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  abierta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  finalizada: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

function EstadoPill({ estado }: { estado: EstadoCompetencia }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${ESTADO_CLS[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  )
}

function CompetenciaModal({
  torneo,
  item,
  onClose,
  onSaved,
}: {
  torneo: CompetenciasTorneo
  item: PuntosCompetencia | null
  onClose: () => void
  onSaved: () => void
}) {
  const [inicio, setInicio] = useState(item?.inicio?.slice(0, 10) ?? '')
  const [fin, setFin] = useState(item?.fin?.slice(0, 10) ?? '')
  const [habilitada, setHabilitada] = useState(item?.habilitada ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!inicio || !fin) {
      setError('Elegí la fecha de inicio y la de fin.')
      return
    }
    if (fin < inicio) {
      setError('La fecha de fin no puede ser anterior a la de inicio.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (item) {
        await actualizarPuntosCompetencia(item.id, { inicio, fin, habilitada })
      } else {
        await crearPuntosCompetencia({ torneo_id: torneo.torneo_id, inicio, fin, habilitada })
      }
      onSaved()
    } catch (e) {
      setError(errMsg(e, 'No pudimos guardar la competencia.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={item ? 'Editar competencia' : 'Nueva competencia'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnCls}>
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving} className={primaryBtnCls}>
            {saving && <Spinner />}
            Guardar
          </button>
        </>
      }
    >
      <p className="text-base text-slate-700 dark:text-slate-200">
        Torneo: <span className="font-semibold">{torneo.torneo_nombre}</span>
      </p>
      <div>
        <span className={labelCls}>Inicio</span>
        <DatePicker value={inicio} onChange={setInicio} size="lg" />
      </div>
      <div>
        <span className={labelCls}>Fin (incluido)</span>
        <DatePicker value={fin} onChange={setFin} size="lg" />
      </div>
      <Toggle checked={habilitada} onChange={setHabilitada} label="Competencia habilitada" />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Cada competencia arranca de cero: solo cuentan los apoyos hechos durante sus fechas.
      </p>
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function CompetenciasSection() {
  const [torneos, setTorneos] = useState<CompetenciasTorneo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<{ torneo: CompetenciasTorneo; item: PuntosCompetencia | null } | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<PuntosCompetencia | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await getPuntosCompetencias()
      setTorneos(res.torneos)
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar las competencias.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (c: PuntosCompetencia, value: boolean) => {
    setToggling(c.id)
    setError('')
    try {
      await actualizarPuntosCompetencia(c.id, { habilitada: value })
      await load()
    } catch (e) {
      setError(errMsg(e, 'No pudimos cambiar la competencia.'))
    } finally {
      setToggling(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await eliminarPuntosCompetencia(deleting.id)
      setDeleting(null)
      await load()
    } catch (e) {
      setDeleteError(errMsg(e, 'No pudimos eliminar la competencia.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-slate-500">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-base text-slate-600 dark:text-slate-300">
        Los jugadores solo pueden apoyar equipos mientras el torneo tiene una competencia en curso.
      </p>
      <ErrorNote message={error} />

      {torneos.length === 0 ? (
        <p className={`${cardCls} text-center text-base text-slate-500 dark:text-slate-400`}>
          No hay torneos en curso.
        </p>
      ) : (
        torneos.map(t => (
          <section key={t.torneo_id} className={`${cardCls} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t.torneo_nombre}</h2>
              <button
                type="button"
                onClick={() => setEditing({ torneo: t, item: null })}
                className={secondaryBtnCls}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden>
                  add
                </span>
                Nueva competencia
              </button>
            </div>

            {t.competencias.length === 0 ? (
              <p className="text-base text-slate-500 dark:text-slate-400">Sin competencias todavía.</p>
            ) : (
              <ul className="space-y-3">
                {t.competencias.map(c => (
                  <li
                    key={c.id}
                    className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-semibold text-slate-900 dark:text-white">
                        Del {formatDate(c.inicio)} al {formatDate(c.fin)}
                      </span>
                      <EstadoPill estado={c.estado} />
                    </div>
                    {c.estado !== 'finalizada' && (
                      <Toggle
                        checked={c.habilitada}
                        disabled={toggling === c.id}
                        onChange={v => toggle(c, v)}
                        label="Habilitada"
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ torneo: t, item: c })}
                        className="h-11 rounded-xl px-4 text-base font-semibold text-primary hover:bg-primary/10"
                      >
                        Editar fechas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setDeleting(c)
                        }}
                        className="h-11 rounded-xl px-4 text-base font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}

      {editing && (
        <CompetenciaModal
          torneo={editing.torneo}
          item={editing.item}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Eliminar competencia"
          message={`¿Eliminar la competencia del ${formatDate(deleting.inicio)} al ${formatDate(deleting.fin)}? Si ya tiene apoyos no se puede eliminar; en ese caso deshabilitala.`}
          confirmLabel="Eliminar"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
