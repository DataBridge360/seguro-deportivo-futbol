'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTorneos } from '@/lib/api'
import type { Torneo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

interface Props {
  basePath: string
  /** Hides the page title when the list is embedded under another page's heading. */
  hideHeader?: boolean
}

function calcularEstado(torneo: Torneo): Torneo['estado'] {
  if (torneo.estado === 'cancelado') return 'cancelado'
  const hoy = new Date().toISOString().split('T')[0]
  if (hoy < torneo.fecha_inicio) return 'proximo'
  if (hoy >= torneo.fecha_inicio && hoy <= torneo.fecha_fin) return 'en_curso'
  return 'finalizado'
}

function getBadgeClasses(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'proximo':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    case 'finalizado':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
    case 'cancelado':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
  }
}

function getEstadoLabel(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso': return 'En curso'
    case 'proximo': return 'Próximo'
    case 'finalizado': return 'Finalizado'
    case 'cancelado': return 'Cancelado'
  }
}

function formatDate(dateString: string) {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

export default function TorneosListPage({ basePath, hideHeader = false }: Props) {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  useEffect(() => {
    loadTorneos()
  }, [])

  const loadTorneos = async () => {
    try {
      setLoading(true)
      const data = await getTorneos()
      setTorneos(data)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar torneos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-4">
        {!hideHeader && <h1 className="text-xl font-bold text-slate-900 dark:text-white">Torneos de Fútbol</h1>}
        <Link
          href={`${basePath}/nuevo`}
          className="flex w-full min-h-[52px] items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-base font-bold shadow-sm transition active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
          Nuevo torneo
        </Link>
      </div>

      {/* Grid */}
      {torneos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">sports_soccer</span>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-base">No hay torneos creados</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-sm">Creá tu primer torneo haciendo clic en &quot;Nuevo&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneos.map((torneo) => {
            const estadoCalculado = calcularEstado(torneo)
            const hoy = new Date().toISOString().split('T')[0]
            const inscAbierta = torneo.inscripcion_inicio && torneo.inscripcion_fin &&
              hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
            return (
              <Link
                key={torneo.id}
                href={`${basePath}/${torneo.id}`}
                className="bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10 p-4 sm:p-5 min-h-[72px] flex flex-col gap-3.5 hover:ring-primary/40 transition active:scale-[0.98]"
              >
                {/* Nombre y estado */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold leading-snug text-slate-900 dark:text-white break-words min-w-0">
                    {torneo.nombre}
                  </h3>
                  <span className={`shrink-0 px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(estadoCalculado)}`}>
                    {getEstadoLabel(estadoCalculado)}
                  </span>
                </div>

                {/* Categorías */}
                {torneo.categorias && torneo.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {torneo.categorias.map((cat) => (
                      <span key={cat.id} className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Descripción */}
                {torneo.descripcion && (
                  <p className="text-base text-slate-500 dark:text-slate-400 line-clamp-3">{torneo.descripcion}</p>
                )}

                {/* Info row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-slate-500 dark:text-slate-400 mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xl">calendar_today</span>
                    {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
                  </span>
                  {torneo.max_jugadores_por_equipo && (
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xl">group</span>
                      Máx. {torneo.max_jugadores_por_equipo}
                    </span>
                  )}
                  {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
                    <span className={`sm:ml-auto text-sm font-semibold ${inscAbierta ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {inscAbierta ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
