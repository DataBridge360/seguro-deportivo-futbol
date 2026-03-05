'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getJugadorTorneos, getJugadorInscripciones, getEquiposTorneo } from '@/lib/api'
import type { JugadorTorneo, JugadorInscripcion, EquipoTorneo } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

function calcularEstado(torneo: JugadorTorneo): string {
  if (torneo.estado === 'cancelado') return 'cancelado'
  const hoy = new Date().toISOString().split('T')[0]
  if (hoy < torneo.fecha_inicio) return 'proximo'
  if (hoy > torneo.fecha_fin) return 'finalizado'
  return 'en_curso'
}

function getBadgeClasses(estado: string) {
  switch (estado) {
    case 'en_curso':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'proximo':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    case 'finalizado':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
    case 'cancelado':
      return 'bg-red-100 text-red-600 dark:bg-red-600/30 dark:text-red-400'
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
  }
}

function getEstadoLabel(estado: string) {
  switch (estado) {
    case 'en_curso': return 'En curso'
    case 'proximo': return 'Pr\u00f3ximo'
    case 'finalizado': return 'Finalizado'
    case 'cancelado': return 'Cancelado'
    default: return estado
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function isInscripcionAbierta(torneo: JugadorTorneo) {
  if (torneo.inscripciones_abiertas) return true
  const hoy = new Date().toISOString().split('T')[0]
  if (torneo.inscripcion_inicio && torneo.inscripcion_fin) {
    return hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
  }
  return false
}

export default function JugadorTorneosPage() {
  const router = useRouter()
  const [torneos, setTorneos] = useState<JugadorTorneo[]>([])
  const [inscripciones, setInscripciones] = useState<JugadorInscripcion[]>([])
  const [tab, setTab] = useState<'disponibles' | 'inscritos'>('inscritos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detalle de torneo
  const [selectedTorneo, setSelectedTorneo] = useState<JugadorTorneo | null>(null)
  const [equiposTorneo, setEquiposTorneo] = useState<EquipoTorneo[]>([])
  const [loadingEquipos, setLoadingEquipos] = useState(false)
  const [categoriaTab, setCategoriaTab] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success',
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [torneosData, inscripcionesData] = await Promise.all([
        getJugadorTorneos(),
        getJugadorInscripciones(),
      ])
      setTorneos(torneosData)
      setInscripciones(inscripcionesData)
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const categoriasDelTorneo = useMemo(() => {
    const map = new Map<string, { nombre: string; count: number }>()
    equiposTorneo.forEach(e => {
      const existing = map.get(e.categoria_nombre)
      if (existing) {
        existing.count++
      } else {
        map.set(e.categoria_nombre, { nombre: e.categoria_nombre, count: 1 })
      }
    })
    return Array.from(map.values())
  }, [equiposTorneo])

  const equiposFiltrados = useMemo(() => {
    let result = equiposTorneo
    if (categoriaTab !== 'todos') {
      result = result.filter(e => e.categoria_nombre === categoriaTab)
    }
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      result = result.filter(e => e.equipo_nombre.toLowerCase().includes(q))
    }
    // Mis equipos primero
    const misInscs = inscripciones.filter(i => i.torneo_id === selectedTorneo?.id)
    if (misInscs.length > 0) {
      const misEquipoIds = new Set(misInscs.map(i => i.torneo_equipo_id))
      result = [...result].sort((a, b) => {
        const aEs = misEquipoIds.has(a.id) ? 0 : 1
        const bEs = misEquipoIds.has(b.id) ? 0 : 1
        return aEs - bEs
      })
    }
    return result
  }, [equiposTorneo, categoriaTab, busqueda, inscripciones, selectedTorneo])

  const estadoOrden: Record<string, number> = { en_curso: 0, proximo: 1, finalizado: 2, cancelado: 3 }

  const inscritosIds = new Set(inscripciones.map(i => i.torneo_id))
  const torneosDisponibles = torneos.filter(t => !inscritosIds.has(t.id))
  const torneosInscritos = torneos
    .filter(t => inscritosIds.has(t.id))
    .sort((a, b) => (estadoOrden[calcularEstado(a)] ?? 9) - (estadoOrden[calcularEstado(b)] ?? 9))

  const handleOpenTorneo = async (torneo: JugadorTorneo) => {
    setSelectedTorneo(torneo)
    setCategoriaTab('todos')
    setBusqueda('')
    setLoadingEquipos(true)
    try {
      const equipos = await getEquiposTorneo(torneo.id)
      setEquiposTorneo(equipos)
    } catch (err: any) {
      setNotification({
        open: true, title: 'Error',
        message: err.message || 'Error al cargar equipos', type: 'error',
      })
      setSelectedTorneo(null)
    } finally {
      setLoadingEquipos(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando torneos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-[#111518] dark:text-white">Torneos</h1></div>
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5 text-center">
          <span className="material-symbols-outlined text-3xl text-red-400 mb-2 block">error</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Vista de detalle de torneo
  if (selectedTorneo) {
    const abierto = isInscripcionAbierta(selectedTorneo)
    const misInscripcionesTorneo = inscripciones.filter(i => i.torneo_id === selectedTorneo.id)

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header con back */}
        <button
          onClick={() => setSelectedTorneo(null)}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver a torneos
        </button>

        {/* Info del torneo */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTorneo.nombre}</h1>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(calcularEstado(selectedTorneo))}`}>
              {getEstadoLabel(calcularEstado(selectedTorneo))}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            <span>{formatDate(selectedTorneo.fecha_inicio)} - {formatDate(selectedTorneo.fecha_fin)}</span>
          </div>
          {selectedTorneo.descripcion && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{selectedTorneo.descripcion}</p>
          )}
          <div className={`flex items-center gap-2 text-xs mt-2 ${abierto ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className="material-symbols-outlined text-sm">{abierto ? 'check_circle' : 'block'}</span>
            <span>
              {abierto
                ? `Inscripciones abiertas${selectedTorneo.inscripcion_fin ? ` hasta ${formatDate(selectedTorneo.inscripcion_fin)}` : ''}`
                : 'Inscripciones cerradas'}
            </span>
          </div>
        </div>

        {/* Mis equipos */}
        {misInscripcionesTorneo.length > 0 && (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 dark:bg-primary/10 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {misInscripcionesTorneo.length === 1 ? 'Estas inscrito en:' : 'Estas inscrito en:'}
              </p>
            </div>
            <div className="ml-9 flex flex-col gap-1.5">
              {misInscripcionesTorneo.map(insc => (
                <div key={insc.id} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{insc.equipo_nombre}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{insc.categoria_nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipos */}
        <div>
          <h2 className="text-sm font-bold text-[#617989] dark:text-slate-400 uppercase tracking-wider mb-3">
            Equipos ({equiposFiltrados.length})
          </h2>

          {/* Category tabs */}
          {!loadingEquipos && categoriasDelTorneo.length > 1 && (
            <div className="mb-3 overflow-x-auto -mx-1 px-1">
              <div className="flex gap-1.5 min-w-max">
                <button
                  onClick={() => setCategoriaTab('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    categoriaTab === 'todos'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Todos ({equiposTorneo.length})
                </button>
                {categoriasDelTorneo.map(cat => (
                  <button
                    key={cat.nombre}
                    onClick={() => setCategoriaTab(cat.nombre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      categoriaTab === cat.nombre
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {cat.nombre} ({cat.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search bar */}
          {!loadingEquipos && equiposTorneo.length > 0 && (
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar equipo..."
                className="w-full pl-9 pr-9 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg">close</span>
                </button>
              )}
            </div>
          )}

          {loadingEquipos ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : equiposTorneo.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">group_off</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay equipos inscriptos en este torneo</p>
            </div>
          ) : equiposFiltrados.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">search_off</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">No se encontraron equipos</p>
              <button
                onClick={() => { setCategoriaTab('todos'); setBusqueda('') }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {equiposFiltrados.map((equipo) => {
                const esMiEquipo = misInscripcionesTorneo.some(i => i.torneo_equipo_id === equipo.id)
                return (
                  <div
                    key={equipo.id}
                    onClick={() => router.push(`/dashboard/jugador/torneos/${selectedTorneo.id}/equipo/${equipo.id}`)}
                    className={`bg-white dark:bg-slate-800 rounded-xl border p-4 cursor-pointer hover:border-primary/50 dark:hover:border-primary/30 transition-colors active:scale-[0.99] ${esMiEquipo ? 'border-primary/40 dark:border-primary/30' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${esMiEquipo ? 'bg-primary/20' : 'bg-primary/10'}`}>
                        <span className="material-symbols-outlined text-primary text-lg">groups</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{equipo.equipo_nombre}</p>
                          {esMiEquipo && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary whitespace-nowrap">Mi equipo</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {equipo.categoria_nombre} &middot; {equipo.jugadores.length} jugador{equipo.jugadores.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">chevron_right</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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

  // Vista principal: lista de torneos
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Torneos</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Consulta los torneos disponibles y tus inscripciones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setTab('disponibles')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'disponibles'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Disponibles
        </button>
        <button
          onClick={() => setTab('inscritos')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'inscritos'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Mis inscripciones {inscripciones.length > 0 && `(${inscripciones.length})`}
        </button>
      </div>

      {/* Torneos disponibles */}
      {tab === 'disponibles' && (
        <div className="flex flex-col gap-3">
          {torneosDisponibles.map((torneo) => {
            const abierto = isInscripcionAbierta(torneo)
            return (
              <button
                key={torneo.id}
                onClick={() => handleOpenTorneo(torneo)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left hover:border-primary/50 dark:hover:border-primary/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(calcularEstado(torneo))}`}>
                    {getEstadoLabel(calcularEstado(torneo))}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>{formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}</span>
                </div>
                {torneo.descripcion && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{torneo.descripcion}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className={`flex items-center gap-1.5 text-xs ${abierto ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <span className="material-symbols-outlined text-sm">{abierto ? 'check_circle' : 'block'}</span>
                    <span>{abierto ? 'Inscripciones abiertas' : 'Inscripciones cerradas'}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                </div>
              </button>
            )
          })}

          {torneosDisponibles.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">emoji_events</span>
              <p className="text-slate-500 dark:text-slate-400">No hay torneos disponibles</p>
            </div>
          )}
        </div>
      )}

      {/* Mis inscripciones: en_curso → proximo → finalizado */}
      {tab === 'inscritos' && (
        <div className="flex flex-col gap-3">
          {torneosInscritos.map((torneo) => {
            const estado = calcularEstado(torneo)
            const torneoInscripciones = inscripciones.filter(i => i.torneo_id === torneo.id)
            return (
              <button
                key={torneo.id}
                onClick={() => handleOpenTorneo(torneo)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left hover:border-primary/50 dark:hover:border-primary/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(estado)}`}>
                    {getEstadoLabel(estado)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="material-symbols-outlined text-base">calendar_today</span>
                  <span>{formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {torneoInscripciones.map((inscripcion) => (
                    <div key={inscripcion.id} className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-base text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1 truncate">{inscripcion.equipo_nombre}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{inscripcion.categoria_nombre}</span>
                      {inscripcion.capitan && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">Cap</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3">
                  <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                    Ver torneo
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </span>
                </div>
              </button>
            )
          })}

          {torneosInscritos.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">emoji_events</span>
              <p className="text-slate-500 dark:text-slate-400">No estás inscrito en ningún torneo</p>
            </div>
          )}
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
