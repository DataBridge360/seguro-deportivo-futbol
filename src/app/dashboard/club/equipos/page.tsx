'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { EQUIPOS_NOMBRES, CATEGORIAS, MOCK_JUGADORES, MOCK_TORNEOS } from '@/lib/mockData'

const TEAM_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  'River Plate': {
    bg: 'bg-red-100 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
  },
  'Boca Juniors': {
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
  },
  'Racing Club': {
    bg: 'bg-sky-100 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-400',
  },
  'Independiente': {
    bg: 'bg-rose-100 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
  },
  'San Lorenzo': {
    bg: 'bg-indigo-100 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-400',
  },
}

interface EquipoDerived {
  nombre: string
  jugadoresCount: number
  categorias: string[]
  torneos: string[]
}

export default function EquiposPage() {
  const router = useRouter()
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<EquipoDerived | null>(null)
  const [torneoFiltro, setTorneoFiltro] = useState<string>('todos')

  // Build teams dynamically from MOCK_JUGADORES
  const equipos = useMemo<EquipoDerived[]>(() => {
    const equipoMap = new Map<string, { categorias: Set<string>; count: number }>()

    for (const jugador of MOCK_JUGADORES) {
      const entry = equipoMap.get(jugador.equipo)
      if (entry) {
        entry.categorias.add(jugador.categoria)
        entry.count++
      } else {
        equipoMap.set(jugador.equipo, {
          categorias: new Set([jugador.categoria]),
          count: 1,
        })
      }
    }

    const result: EquipoDerived[] = []

    for (const nombre of EQUIPOS_NOMBRES) {
      const data = equipoMap.get(nombre)
      if (!data) continue

      // Find tournaments this team participates in
      const torneos = MOCK_TORNEOS
        .filter((t) => t.equipos.includes(nombre))
        .map((t) => t.nombre)

      // Sort categories in the order defined in CATEGORIAS
      const categoriasOrdenadas = Array.from(data.categorias).sort(
        (a, b) => CATEGORIAS.indexOf(a as typeof CATEGORIAS[number]) - CATEGORIAS.indexOf(b as typeof CATEGORIAS[number])
      )

      result.push({
        nombre,
        jugadoresCount: data.count,
        categorias: categoriasOrdenadas,
        torneos,
      })
    }

    return result
  }, [])

  // Filter teams by selected tournament
  const equiposFiltrados = useMemo(() => {
    if (torneoFiltro === 'todos') return equipos

    const torneo = MOCK_TORNEOS.find((t) => t.id === torneoFiltro)
    if (!torneo) return equipos

    return equipos.filter((e) => torneo.equipos.includes(e.nombre))
  }, [equipos, torneoFiltro])

  // Get players for the selected team, grouped by category
  const jugadoresPorCategoria = useMemo(() => {
    if (!equipoSeleccionado) return {}

    const jugadoresEquipo = MOCK_JUGADORES.filter(
      (j) => j.equipo === equipoSeleccionado.nombre
    )

    const grouped: Record<string, typeof MOCK_JUGADORES> = {}

    for (const cat of CATEGORIAS) {
      const jugadoresEnCat = jugadoresEquipo.filter((j) => j.categoria === cat)
      if (jugadoresEnCat.length > 0) {
        grouped[cat] = jugadoresEnCat
      }
    }

    return grouped
  }, [equipoSeleccionado])

  const getBadge = (nombre: string) =>
    TEAM_BADGE_COLORS[nombre] || { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400' }

  const TORNEO_BADGE_COLORS = [
    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
    'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400',
  ]

  const getTorneoBadgeColor = (torneoNombre: string) => {
    const idx = MOCK_TORNEOS.findIndex((t) => t.nombre === torneoNombre)
    return TORNEO_BADGE_COLORS[idx % TORNEO_BADGE_COLORS.length]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestioná los equipos del club</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/club/equipos/nuevo')}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo Equipo
        </button>
      </div>

      {/* Tournament filter */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl">filter_list</span>
        <select
          value={torneoFiltro}
          onChange={(e) => setTorneoFiltro(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="todos">Todos los torneos</option>
          {MOCK_TORNEOS.map((torneo) => (
            <option key={torneo.id} value={torneo.id}>
              {torneo.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de equipos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equiposFiltrados.map((equipo) => {
          const badge = getBadge(equipo.nombre)

          return (
            <div
              key={equipo.nombre}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4"
            >
              {/* Nombre y badge del equipo */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{equipo.nombre}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {equipo.categorias.map((cat) => (
                    <span
                      key={cat}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cantidad de jugadores */}
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <span className="material-symbols-outlined text-base">group</span>
                <span>{equipo.jugadoresCount} jugadores</span>
              </div>

              {/* Torneos badges */}
              {equipo.torneos.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Torneos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {equipo.torneos.map((torneo) => (
                      <span
                        key={torneo}
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTorneoBadgeColor(torneo)}`}
                      >
                        {torneo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón ver detalle */}
              <button
                onClick={() => setEquipoSeleccionado(equipo)}
                className="mt-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver detalle
              </button>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {equiposFiltrados.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">search_off</span>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">No hay equipos en este torneo</p>
        </div>
      )}

      {/* Modal de detalle */}
      {equipoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setEquipoSeleccionado(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del modal */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {equipoSeleccionado.nombre}
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {equipoSeleccionado.categorias.map((cat) => {
                  const badge = getBadge(equipoSeleccionado.nombre)
                  return (
                    <span
                      key={cat}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      {cat}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Torneos del equipo */}
            {equipoSeleccionado.torneos.length > 0 && (
              <div className="mb-5">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                  Torneos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {equipoSeleccionado.torneos.map((torneo) => (
                    <span
                      key={torneo}
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTorneoBadgeColor(torneo)}`}
                    >
                      {torneo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Jugadores agrupados por categoría */}
            <div className="mb-5">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
                Jugadores ({equipoSeleccionado.jugadoresCount})
              </p>
              <div className="max-h-64 overflow-y-auto space-y-4 pr-1">
                {Object.entries(jugadoresPorCategoria).map(([categoria, jugadores]) => {
                  const badge = getBadge(equipoSeleccionado.nombre)
                  return (
                    <div key={categoria}>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {categoria}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          ({jugadores.length})
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {jugadores.map((jugador) => (
                          <div
                            key={jugador.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                          >
                            <span className="text-sm text-slate-900 dark:text-white font-medium">
                              {jugador.nombreCompleto}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              DNI {jugador.dni}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setEquipoSeleccionado(null)}
              className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
