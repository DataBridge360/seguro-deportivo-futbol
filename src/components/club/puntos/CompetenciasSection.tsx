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
  EmptyState,
  ListSkeleton,
  SectionHeader,
  cardCls,
  compactPrimaryBtnCls,
  errMsg,
  formatDate,
  iconBtnCls,
  iconDangerBtnCls,
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
  torneos,
  torneo: initialTorneo,
  item,
  onClose,
  onSaved,
}: {
  /** Tournaments the competencia can be created in (only used when creating). */
  torneos: CompetenciasTorneo[]
  /** Tournament of the competencia being edited; null when creating. */
  torneo: CompetenciasTorneo | null
  item: PuntosCompetencia | null
  onClose: () => void
  onSaved: () => void
}) {
  const [torneoId, setTorneoId] = useState(initialTorneo?.torneo_id ?? '')
  const [inicio, setInicio] = useState(item?.inicio?.slice(0, 10) ?? '')
  const [fin, setFin] = useState(item?.fin?.slice(0, 10) ?? '')
  const [habilitada, setHabilitada] = useState(item?.habilitada ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!item && !torneoId) {
      setError('Elegí el torneo de la competencia.')
      return
    }
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
        await crearPuntosCompetencia({ torneo_id: torneoId, inicio, fin, habilitada })
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
      {item ? (
        <p className="break-words text-base text-slate-700 dark:text-slate-200">
          Torneo: <span className="font-semibold">{initialTorneo?.torneo_nombre}</span>
        </p>
      ) : (
        <div>
          <span id="competencia-torneo-label" className={labelCls}>
            Torneo
          </span>
          {torneos.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              No hay torneos en curso. Las competencias se crean dentro de un torneo que esté en curso.
            </p>
          ) : (
            <div role="radiogroup" aria-labelledby="competencia-torneo-label" className="space-y-2">
              {torneos.map(t => {
                const selected = torneoId === t.torneo_id
                return (
                  <button
                    key={t.torneo_id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTorneoId(t.torneo_id)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined shrink-0 text-2xl ${selected ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
                      aria-hidden
                    >
                      {selected ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    <span className="min-w-0 flex-1 break-words text-base font-semibold text-slate-900 dark:text-white">
                      {t.torneo_nombre}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
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
  const [editing, setEditing] = useState<{ torneo: CompetenciasTorneo | null; item: PuntosCompetencia | null } | null>(null)
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
    return <ListSkeleton className="h-32" rows={2} />
  }

  const withCompetencias = torneos.filter(t => t.competencias.length > 0)
  const newButton = (
    <button type="button" onClick={() => setEditing({ torneo: null, item: null })} className={compactPrimaryBtnCls}>
      <span className="material-symbols-outlined text-xl" aria-hidden>
        add
      </span>
      Nueva competencia
    </button>
  )

  return (
    <div className="space-y-4">
      <SectionHeader
        description="Los jugadores solo pueden apoyar equipos mientras el torneo tiene una competencia en curso."
        action={withCompetencias.length > 0 ? newButton : undefined}
      />
      <ErrorNote message={error} />

      {withCompetencias.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon="emoji_events"
            title="Todavía no hay competencias"
            hint="Una competencia define las fechas en las que los jugadores pueden apoyar equipos de un torneo."
          />
          <button
            type="button"
            onClick={() => setEditing({ torneo: null, item: null })}
            className={`${primaryBtnCls} w-full sm:mx-auto sm:w-auto`}
          >
            <span className="material-symbols-outlined text-xl" aria-hidden>
              add
            </span>
            Nueva competencia
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {withCompetencias.map(t => (
            <section key={t.torneo_id} className={`${cardCls} space-y-3`}>
              <h2 className="break-words text-base font-bold text-slate-900 dark:text-white">{t.torneo_nombre}</h2>

              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {t.competencias.map(c => (
                  <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Del {formatDate(c.inicio)} al {formatDate(c.fin)}
                      </p>
                      <EstadoPill estado={c.estado} />
                    </div>
                    {c.estado !== 'finalizada' && (
                      <div className="w-36">
                        <Toggle
                          checked={c.habilitada}
                          disabled={toggling === c.id}
                          onChange={v => toggle(c, v)}
                          label="Habilitada"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Editar fechas de la competencia del ${formatDate(c.inicio)}`}
                      onClick={() => setEditing({ torneo: t, item: c })}
                      className={iconBtnCls}
                    >
                      <span className="material-symbols-outlined text-xl">edit_calendar</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar la competencia del ${formatDate(c.inicio)}`}
                      onClick={() => {
                        setDeleteError('')
                        setDeleting(c)
                      }}
                      className={iconDangerBtnCls}
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <CompetenciaModal
          torneos={torneos}
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
