'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_PARTIDOS, EQUIPOS_NOMBRES, formatDate } from '@/lib/mockData'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export default function CalendarioPage() {
  const router = useRouter()
  const hoy = new Date()
  const [viewYear, setViewYear] = useState(hoy.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoy.getMonth())

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
    MOCK_PARTIDOS.forEach((p) => {
      const [y, m, d] = p.fecha.split('-').map(Number)
      if (y === viewYear && m - 1 === viewMonth) {
        set.add(d)
      }
    })
    return set
  }, [viewYear, viewMonth])

  // Matches for the current viewed month
  const partidosDelMes = useMemo(() => {
    return MOCK_PARTIDOS
      .filter((p) => {
        const [y, m] = p.fecha.split('-').map(Number)
        return y === viewYear && m - 1 === viewMonth
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [viewYear, viewMonth])

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
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
                >
                  {/* Date and time on left */}
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(p.fecha)}
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{p.hora}</p>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

                  {/* Match details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {p.equipoLocal} vs {p.equipoVisitante}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {p.torneo} · {p.ubicacion}
                    </p>
                  </div>
                </div>
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
    </div>
  )
}
