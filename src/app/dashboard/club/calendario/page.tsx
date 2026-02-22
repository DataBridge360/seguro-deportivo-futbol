'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPartidos } from '@/lib/api'
import type { Partido } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export default function CalendarioPage() {
  const router = useRouter()
  const hoy = new Date()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(hoy.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoy.getMonth())
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadPartidos()
  }, [])

  const loadPartidos = async () => {
    try {
      setLoading(true)
      const data = await getPartidos()
      setPartidos(data)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar partidos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Build calendar grid for current month
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(viewYear, viewMonth, 1)
    const ultimoDia = new Date(viewYear, viewMonth + 1, 0)

    const dias: (number | null)[] = []

    // Empty slots before the first day
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null)
    }

    // All days of the month
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(i)
    }

    return dias
  }, [viewYear, viewMonth])

  // Set of days (as number) that have matches in the current month
  const diasConPartidos = useMemo(() => {
    const set = new Set<number>()
    partidos.forEach((p) => {
      const [y, m, d] = p.fecha.split('-').map(Number)
      if (y === viewYear && m - 1 === viewMonth) {
        set.add(d)
      }
    })
    return set
  }, [partidos, viewYear, viewMonth])

  // Matches for the current viewed month
  const partidosDelMes = useMemo(() => {
    return partidos
      .filter((p) => {
        const [y, m] = p.fecha.split('-').map(Number)
        return y === viewYear && m - 1 === viewMonth
      })
      .sort((a, b) => {
        const dateCompare = a.fecha.localeCompare(b.fecha)
        if (dateCompare !== 0) return dateCompare
        return a.hora.localeCompare(b.hora)
      })
  }, [partidos, viewYear, viewMonth])

  // Navigation
  const mesAnterior = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const mesSiguiente = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // Check if a day is today
  const esHoy = (dia: number) => {
    return dia === hoy.getDate() && viewMonth === hoy.getMonth() && viewYear === hoy.getFullYear()
  }

  const getEstadoBadge = (estado: Partido['estado']) => {
    switch (estado) {
      case 'programado':
        return 'bg-blue-500/10 text-blue-500'
      case 'en_curso':
        return 'bg-green-500/10 text-green-500'
      case 'finalizado':
        return 'bg-slate-500/10 text-slate-500'
      case 'suspendido':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'cancelado':
        return 'bg-red-500/10 text-red-500'
    }
  }

  const getEstadoLabel = (estado: Partido['estado']) => {
    switch (estado) {
      case 'programado':
        return 'Programado'
      case 'en_curso':
        return 'En curso'
      case 'finalizado':
        return 'Finalizado'
      case 'suspendido':
        return 'Suspendido'
      case 'cancelado':
        return 'Cancelado'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Partidos y eventos programados</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/club/calendario/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo Partido
        </button>
      </div>

      {/* Calendar + Match list: side by side on desktop, stacked on mobile */}
      <div className="md:grid md:grid-cols-2 md:gap-6">
        {/* Calendar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={mesAnterior}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">chevron_left</span>
            </button>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {MESES[viewMonth]} {viewYear}
            </h2>

            <button
              onClick={mesSiguiente}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">chevron_right</span>
            </button>
          </div>

          {/* Days header */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map((dia) => (
              <div
                key={dia}
                className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {diasDelMes.map((dia, index) => (
              <div key={index} className="aspect-square md:aspect-auto md:h-10 flex items-center justify-center">
                {dia !== null && (
                  <div
                    className={`
                      w-full h-full flex flex-col items-center justify-center rounded-lg relative
                      ${esHoy(dia)
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-slate-900 dark:text-white'
                      }
                    `}
                  >
                    <span className="text-sm">{dia}</span>
                    {diasConPartidos.has(dia) && (
                      <span
                        className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                          esHoy(dia) ? 'bg-primary' : 'bg-primary'
                        }`}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Matches list for the month */}
        <div className="mt-6 md:mt-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Partidos de {MESES[viewMonth]}
          </h2>

          {partidosDelMes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {partidosDelMes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/club/partidos/${p.id}`)}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-primary dark:hover:border-primary transition-colors text-left w-full"
                >
                  <div className="flex items-start gap-4">
                    {/* Date and time on left */}
                    <div className="text-center min-w-[50px]">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(p.fecha)}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{p.hora}</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-slate-200 dark:border-slate-700" />

                    {/* Match details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {p.equipo_local_nombre} vs {p.equipo_visitante_nombre}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {p.torneo_nombre}
                      </p>
                      {p.ubicacion && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {p.ubicacion}{p.cancha && ` - ${p.cancha}`}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(p.estado)}`}>
                          {getEstadoLabel(p.estado)}
                        </span>
                      </div>
                      {p.estado === 'finalizado' && p.resultado_local !== null && p.resultado_visitante !== null && (
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">
                          Resultado: {p.resultado_local} - {p.resultado_visitante}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
              <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-400">event_busy</span>
              </div>
              <p className="text-base font-medium text-slate-900 dark:text-white mb-1">Sin partidos</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No hay partidos programados para {MESES[viewMonth]} {viewYear}
              </p>
            </div>
          )}
        </div>
      </div>

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
