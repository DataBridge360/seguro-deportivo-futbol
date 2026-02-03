'use client'

import { useState, useMemo } from 'react'

// Tipos
interface Partido {
  id: string
  fecha: Date
  hora: string
  equipoLocal: string
  equipoVisitante: string
  ubicacion: string
  competicion: string
}

// Función para generar partidos dinámicos basados en la fecha actual
function generarPartidosMock(): Partido[] {
  const hoy = new Date()
  const año = hoy.getFullYear()
  const mes = hoy.getMonth()

  return [
    // Partidos del mes actual
    {
      id: '1',
      fecha: new Date(año, mes, 5),
      hora: '15:00',
      equipoLocal: 'Leones FC',
      equipoVisitante: 'Tigres United',
      ubicacion: 'Estadio Municipal',
      competicion: 'Liga Regional'
    },
    {
      id: '2',
      fecha: new Date(año, mes, 12),
      hora: '17:30',
      equipoLocal: 'Deportivo Sur',
      equipoVisitante: 'Leones FC',
      ubicacion: 'Cancha Deportivo Sur',
      competicion: 'Liga Regional'
    },
    {
      id: '3',
      fecha: new Date(año, mes, 19),
      hora: '16:00',
      equipoLocal: 'Leones FC',
      equipoVisitante: 'Athletic Club',
      ubicacion: 'Estadio Municipal',
      competicion: 'Copa Provincial'
    },
    {
      id: '4',
      fecha: new Date(año, mes, 26),
      hora: '11:00',
      equipoLocal: 'Unidos FC',
      equipoVisitante: 'Leones FC',
      ubicacion: 'Complejo Unidos',
      competicion: 'Liga Regional'
    },
    // Partidos del mes siguiente
    {
      id: '5',
      fecha: new Date(año, mes + 1, 3),
      hora: '15:00',
      equipoLocal: 'Leones FC',
      equipoVisitante: 'Real Sociedad',
      ubicacion: 'Estadio Municipal',
      competicion: 'Liga Regional'
    },
    {
      id: '6',
      fecha: new Date(año, mes + 1, 10),
      hora: '19:00',
      equipoLocal: 'Halcones FC',
      equipoVisitante: 'Leones FC',
      ubicacion: 'Estadio Halcones',
      competicion: 'Copa Provincial'
    },
    {
      id: '7',
      fecha: new Date(año, mes + 1, 17),
      hora: '16:30',
      equipoLocal: 'Leones FC',
      equipoVisitante: 'Pumas FC',
      ubicacion: 'Estadio Municipal',
      competicion: 'Liga Regional'
    },
    {
      id: '8',
      fecha: new Date(año, mes + 1, 17), // Mismo día, segundo partido
      hora: '20:00',
      equipoLocal: 'Leones FC B',
      equipoVisitante: 'Reservas Norte',
      ubicacion: 'Cancha Auxiliar',
      competicion: 'Liga Reserva'
    },
    {
      id: '9',
      fecha: new Date(año, mes + 1, 24),
      hora: '15:00',
      equipoLocal: 'Racing Club',
      equipoVisitante: 'Leones FC',
      ubicacion: 'Estadio Racing',
      competicion: 'Liga Regional'
    },
    // Partidos del mes anterior
    {
      id: '10',
      fecha: new Date(año, mes - 1, 8),
      hora: '17:00',
      equipoLocal: 'Leones FC',
      equipoVisitante: 'Independiente',
      ubicacion: 'Estadio Municipal',
      competicion: 'Copa Provincial'
    },
    {
      id: '11',
      fecha: new Date(año, mes - 1, 22),
      hora: '15:30',
      equipoLocal: 'Águilas FC',
      equipoVisitante: 'Leones FC',
      ubicacion: 'Estadio Águilas',
      competicion: 'Liga Regional'
    },
  ]
}

const partidosMock = generarPartidosMock()

// Nombres de meses y días en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_SEMANA_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function JugadorPartidosPage() {
  const hoy = new Date()
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(hoy)

  // Obtener días del mes
  const diasDelMes = useMemo(() => {
    const year = mesActual.getFullYear()
    const month = mesActual.getMonth()

    const primerDia = new Date(year, month, 1)
    const ultimoDia = new Date(year, month + 1, 0)

    const dias: (Date | null)[] = []

    // Agregar espacios vacíos para los días antes del primer día del mes
    for (let i = 0; i < primerDia.getDay(); i++) {
      dias.push(null)
    }

    // Agregar todos los días del mes
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(new Date(year, month, i))
    }

    return dias
  }, [mesActual])

  // Obtener fechas que tienen partidos
  const fechasConPartidos = useMemo(() => {
    const fechas = new Set<string>()
    partidosMock.forEach(partido => {
      fechas.add(partido.fecha.toDateString())
    })
    return fechas
  }, [])

  // Obtener partidos de la fecha seleccionada
  const partidosDelDia = useMemo(() => {
    if (!fechaSeleccionada) return []
    return partidosMock.filter(
      partido => partido.fecha.toDateString() === fechaSeleccionada.toDateString()
    )
  }, [fechaSeleccionada])

  // Obtener próximos partidos del mes
  const proximosPartidosMes = useMemo(() => {
    const inicioMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)
    const finMes = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0)

    return partidosMock
      .filter(p => p.fecha >= inicioMes && p.fecha <= finMes)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
  }, [mesActual])

  // Navegación entre meses
  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1))
  }

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1))
  }

  // Verificar si una fecha es hoy
  const esHoy = (fecha: Date) => {
    const hoy = new Date()
    return fecha.toDateString() === hoy.toDateString()
  }

  // Verificar si una fecha está seleccionada
  const estaSeleccionada = (fecha: Date) => {
    return fechaSeleccionada?.toDateString() === fecha.toDateString()
  }

  // Verificar si una fecha tiene partidos
  const tienePartidos = (fecha: Date) => {
    return fechasConPartidos.has(fecha.toDateString())
  }

  // Formatear fecha para mostrar
  const formatearFecha = (fecha: Date) => {
    return `${DIAS_SEMANA_FULL[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
  }

  const formatearFechaCorta = (fecha: Date) => {
    return `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}`
  }

  return (
    <div className="space-y-4 mb-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6">
      {/* Columna izquierda - Calendario */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden lg:sticky lg:top-4">
          {/* Header del calendario */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[#617989] dark:text-slate-400">
                  chevron_left
                </span>
              </button>

              <h2 className="text-base sm:text-lg font-bold text-[#111518] dark:text-white">
                {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
              </h2>

              <button
                onClick={mesSiguiente}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <span className="material-symbols-outlined text-[#617989] dark:text-slate-400">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
            {DIAS_SEMANA.map(dia => (
              <div
                key={dia}
                className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-[#617989] dark:text-slate-400 uppercase"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7 p-2 sm:p-3 gap-1">
            {diasDelMes.map((dia, index) => (
              <div key={index} className="aspect-square">
                {dia && (
                  <button
                    onClick={() => setFechaSeleccionada(dia)}
                    className={`
                      w-full h-full rounded-xl flex flex-col items-center justify-center relative
                      transition-all duration-200
                      ${estaSeleccionada(dia)
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : esHoy(dia)
                          ? 'bg-primary/10 text-primary font-bold'
                          : tienePartidos(dia)
                            ? 'hover:bg-primary/5 text-[#111518] dark:text-white'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-[#111518] dark:text-white'
                      }
                    `}
                  >
                    <span className="text-xs sm:text-sm">{dia.getDate()}</span>
                    {tienePartidos(dia) && (
                      <span
                        className={`
                          absolute bottom-1 sm:bottom-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full
                          ${estaSeleccionada(dia) ? 'bg-white' : 'bg-primary'}
                        `}
                      />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex items-center gap-4 text-[10px] sm:text-xs text-[#617989] dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Partido programado</span>
            </div>
          </div>

          {/* Resumen del mes - Solo desktop */}
          {proximosPartidosMes.length > 0 && (
            <div className="hidden lg:block border-t border-slate-100 dark:border-slate-700 p-4">
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">
                  {proximosPartidosMes.length}
                </p>
                <p className="text-xs text-primary/70 uppercase tracking-wider">
                  {proximosPartidosMes.length === 1 ? 'Partido este mes' : 'Partidos este mes'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columna derecha - Partidos */}
      <div className="lg:col-span-7 xl:col-span-8">
        {/* Partidos del día seleccionado */}
        {fechaSeleccionada ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 uppercase tracking-widest px-1">
                {formatearFecha(fechaSeleccionada)}
              </p>
              {partidosDelDia.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                  {partidosDelDia.length} {partidosDelDia.length === 1 ? 'partido' : 'partidos'}
                </span>
              )}
            </div>

            {partidosDelDia.length > 0 ? (
              <div className="flex flex-col gap-4">
                {partidosDelDia.map(partido => (
                  <div
                    key={partido.id}
                    className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                  >
                    {/* Header con competición */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-xl">
                        sports_soccer
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-[#617989] dark:text-slate-400">
                        {partido.competicion}
                      </span>
                    </div>

                    {/* Equipos */}
                    <div className="flex  items-center justify-between mb-4 py-2">
                      <div className="text-center flex-1">
                        <div className={`
                          size-14 sm:size-16 lg:size-20 rounded-2xl mx-auto mb-2 flex items-center justify-center
                          ${partido.equipoLocal.includes('Leones')
                            ? 'bg-primary/10'
                            : 'bg-slate-100 dark:bg-slate-700'
                          }
                        `}>
                          <span className={`
                            material-symbols-outlined text-2xl sm:text-3xl lg:text-4xl
                            ${partido.equipoLocal.includes('Leones') ? 'text-primary' : 'text-slate-400'}
                          `}>
                            shield
                          </span>
                        </div>
                        <p className={`
                          font-bold text-sm sm:text-base lg:text-lg
                          ${partido.equipoLocal.includes('Leones')
                            ? 'text-primary'
                            : 'text-[#111518] dark:text-white'
                          }
                        `}>
                          {partido.equipoLocal}
                        </p>
                      </div>

                      <div className="text-center px-4 sm:px-6">
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-200 dark:text-slate-600">
                          VS
                        </p>
                      </div>

                      <div className="text-center flex-1">
                        <div className={`
                          size-14 sm:size-16 lg:size-20 rounded-2xl mx-auto mb-2 flex items-center justify-center
                          ${partido.equipoVisitante.includes('Leones')
                            ? 'bg-primary/10'
                            : 'bg-slate-100 dark:bg-slate-700'
                          }
                        `}>
                          <span className={`
                            material-symbols-outlined text-2xl sm:text-3xl lg:text-4xl
                            ${partido.equipoVisitante.includes('Leones') ? 'text-primary' : 'text-slate-400'}
                          `}>
                            shield
                          </span>
                        </div>
                        <p className={`
                          font-bold text-sm sm:text-base lg:text-lg
                          ${partido.equipoVisitante.includes('Leones')
                            ? 'text-primary'
                            : 'text-[#111518] dark:text-white'
                          }
                        `}>
                          {partido.equipoVisitante}
                        </p>
                      </div>
                    </div>

                    {/* Info del partido */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-[#617989] dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        <span className="font-medium">{partido.hora}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#617989] dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">location_on</span>
                        <span>{partido.ubicacion}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center">
                <div className="size-16 sm:size-20 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400">
                    event_busy
                  </span>
                </div>
                <p className="text-base sm:text-lg font-medium text-[#111518] dark:text-white mb-1">
                  Sin partidos
                </p>
                <p className="text-sm text-[#617989] dark:text-slate-400">
                  No hay partidos programados para este día
                </p>
              </div>
            )}

            {/* Lista de próximos partidos del mes - Solo en desktop */}
            {proximosPartidosMes.length > 0 && (
              <div className="hidden lg:block mt-6">
                <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 uppercase tracking-widest px-1 mb-4">
                  Todos los partidos de {MESES[mesActual.getMonth()]}
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
                  {proximosPartidosMes.map((partido, index) => (
                    <button
                      key={partido.id}
                      onClick={() => setFechaSeleccionada(partido.fecha)}
                      className={`
                        w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left
                        ${index !== proximosPartidosMes.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}
                        ${partido.fecha.toDateString() === fechaSeleccionada?.toDateString() ? 'bg-primary/5' : ''}
                      `}
                    >
                      {/* Fecha */}
                      <div className="w-14 text-center shrink-0">
                        <p className="text-lg font-bold text-[#111518] dark:text-white">
                          {partido.fecha.getDate()}
                        </p>
                        <p className="text-[10px] text-[#617989] dark:text-slate-400 uppercase">
                          {DIAS_SEMANA[partido.fecha.getDay()]}
                        </p>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111518] dark:text-white truncate">
                          {partido.equipoLocal} vs {partido.equipoVisitante}
                        </p>
                        <p className="text-xs text-[#617989] dark:text-slate-400 truncate">
                          {partido.competicion} · {partido.hora}
                        </p>
                      </div>

                      {/* Flecha */}
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">
                        chevron_right
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 sm:p-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
            <div className="size-16 sm:size-20 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-slate-400">
                touch_app
              </span>
            </div>
            <p className="text-base sm:text-lg font-medium text-[#111518] dark:text-white mb-1">
              Selecciona una fecha
            </p>
            <p className="text-sm text-[#617989] dark:text-slate-400">
              Haz clic en el calendario para ver los partidos programados
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
