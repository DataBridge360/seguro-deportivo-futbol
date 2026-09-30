'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getDelegadosEquipoAdmin, getJugadoresEquipoTorneo } from '@/lib/api'

interface Props {
  open: boolean
  equipoNombre: string
  torneoId: string
  inscripcionId: string
  // When both counts are provided the modal does not fetch them
  jugadoresCount?: number
  delegadosCount?: number
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

function plural(n: number, singular: string, pluralForm: string) {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

export default function ConfirmDesinscribirModal({
  open,
  equipoNombre,
  torneoId,
  inscripcionId,
  jugadoresCount,
  delegadosCount,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fetched, setFetched] = useState<{ jugadores: number; delegados: number } | null>(null)

  const provided = jugadoresCount !== undefined && delegadosCount !== undefined

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open || provided) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setFetched(null)
    Promise.all([getJugadoresEquipoTorneo(torneoId, inscripcionId), getDelegadosEquipoAdmin(inscripcionId)])
      .then(([jugadores, delegados]) => {
        if (!cancelled) setFetched({ jugadores: jugadores.length, delegados: delegados.length })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, provided, torneoId, inscripcionId])

  if (!mounted || !open) return null

  const counts = provided ? { jugadores: jugadoresCount, delegados: delegadosCount } : fetched
  const n = counts?.jugadores ?? 0

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <span className="material-symbols-outlined text-lg text-red-500">warning</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Desinscribir equipo</h3>
        </div>
        <p className="mb-3 text-base text-slate-600 dark:text-slate-300">
          ¿Desinscribir a <strong>«{equipoNombre}»</strong> del torneo?
        </p>

        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              Contando jugadores y delegados...
            </span>
          ) : failed || !counts ? (
            'No pudimos contar los jugadores. Al desinscribir, todos los jugadores y delegados quedan fuera del equipo.'
          ) : counts.jugadores === 0 && counts.delegados === 0 ? (
            'El equipo no tiene jugadores ni delegados cargados.'
          ) : (
            <>
              Se van a desvincular <strong>{plural(counts.jugadores, 'jugador', 'jugadores')}</strong> y{' '}
              <strong>{plural(counts.delegados, 'delegado', 'delegados')}</strong> de este equipo en el torneo. Todos
              los jugadores quedan fuera del equipo; sus cuentas no se borran.
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 flex-1 rounded-lg bg-slate-100 px-4 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || loading}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Desinscribiendo...
              </>
            ) : n > 0 ? (
              `Desinscribir y desvincular ${n}`
            ) : (
              'Desinscribir'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
