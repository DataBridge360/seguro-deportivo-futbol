'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTorneos } from '@/lib/api'
import type { Torneo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

interface Props {
  basePath: string
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

export default function TorneosListPage({ basePath }: Props) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Torneos</h1>
        <Link
          href={`${basePath}/nuevo`}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo
        </Link>
      </div>

      {/* Grid */}
      {torneos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">sports_soccer</span>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">No hay torneos creados</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primer torneo haciendo clic en &quot;Nuevo&quot;</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {torneos.map((torneo) => {
            const estadoCalculado = calcularEstado(torneo)
            const hoy = new Date().toISOString().split('T')[0]
            const inscAbierta = torneo.inscripcion_inicio && torneo.inscripcion_fin &&
              hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
            return (
              <Link
                key={torneo.id}
                href={`${basePath}/${torneo.id}`}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3 hover:border-primary/40 transition-colors"
              >
                {/* Nombre y estado */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {torneo.nombre}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(estadoCalculado)}`}>
                    {getEstadoLabel(estadoCalculado)}
                  </span>
                </div>

                {/* Categorías */}
                {torneo.categorias && torneo.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {torneo.categorias.map((cat) => (
                      <span key={cat.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Descripción */}
                {torneo.descripcion && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{torneo.descripcion}</p>
                )}

                {/* Info row */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
                  </span>
                  {torneo.max_jugadores_por_equipo && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">group</span>
                      Máx. {torneo.max_jugadores_por_equipo}
                    </span>
                  )}
                  {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
                    <span className={`ml-auto text-[10px] font-semibold ${inscAbierta ? 'text-green-500' : 'text-slate-400'}`}>
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
