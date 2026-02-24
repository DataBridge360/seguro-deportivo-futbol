'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTorneos } from '@/lib/api'
import type { Torneo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

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
    case 'en_curso':
      return 'En curso'
    case 'proximo':
      return 'Próximo'
    case 'finalizado':
      return 'Finalizado'
    case 'cancelado':
      return 'Cancelado'
  }
}

function formatDate(dateString: string) {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

export default function ClubTorneosPage() {
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando torneos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Torneos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Torneos organizados por tu club
          </p>
        </div>
        <Link
          href="/dashboard/club/torneos/nuevo"
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nuevo Torneo
        </Link>
      </div>

      {/* Cards grid */}
      {torneos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">sports_soccer</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay torneos creados</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primer torneo haciendo clic en "Nuevo Torneo"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneos.map((torneo) => (
            <div
              key={torneo.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4"
            >
              {/* Nombre y estado */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {torneo.nombre}
                </h3>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}
                >
                  {getEstadoLabel(torneo.estado)}
                </span>
              </div>

              {/* Descripción */}
              {torneo.descripcion && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {torneo.descripcion}
                </p>
              )}

              {/* Fechas */}
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>
                  {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
                </span>
              </div>

              {/* Max jugadores */}
              {torneo.max_jugadores_por_equipo && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-lg">group</span>
                  <span>Máx. {torneo.max_jugadores_por_equipo} jugadores por equipo</span>
                </div>
              )}

              {/* Período de inscripción */}
              {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">how_to_reg</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Inscripciones</span>
                  </div>
                  {(() => {
                    const hoy = new Date().toISOString().split('T')[0]
                    const abierta = torneo.inscripcion_inicio && torneo.inscripcion_fin &&
                      hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
                    return (
                      <span className={`text-xs font-semibold ${abierta ? 'text-green-500' : 'text-slate-400'}`}>
                        {abierta ? 'Abiertas' : 'Cerradas'}
                      </span>
                    )
                  })()}
                </div>
              )}

              {/* Botón */}
              <div className="mt-auto">
                <Link
                  href={`/dashboard/club/torneos/${torneo.id}`}
                  className="block w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors text-center"
                >
                  Gestionar
                </Link>
              </div>
            </div>
          ))}
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
