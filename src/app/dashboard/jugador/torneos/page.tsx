'use client'

import { useState, useEffect } from 'react'
import { getJugadorTorneos, getJugadorInscripciones, getEquiposTorneo, inscribirseEquipo, desinscribirseEquipo } from '@/lib/api'
import type { JugadorTorneo, JugadorInscripcion, EquipoTorneo } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

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
  const hoy = new Date().toISOString().split('T')[0]
  if (torneo.inscripciones_abiertas) {
    if (torneo.inscripcion_fin && hoy > torneo.inscripcion_fin) return false
    return true
  }
  if (torneo.inscripcion_inicio && torneo.inscripcion_fin) {
    return hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
  }
  return false
}

export default function JugadorTorneosPage() {
  const [torneos, setTorneos] = useState<JugadorTorneo[]>([])
  const [inscripciones, setInscripciones] = useState<JugadorInscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'disponibles' | 'inscritos'>('disponibles')

  // Detalle de torneo
  const [selectedTorneo, setSelectedTorneo] = useState<JugadorTorneo | null>(null)
  const [equiposTorneo, setEquiposTorneo] = useState<EquipoTorneo[]>([])
  const [loadingEquipos, setLoadingEquipos] = useState(false)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [desinscribiendo, setDesinscribiendo] = useState(false)
  const [showConfirmSalir, setShowConfirmSalir] = useState(false)
  const [expandedEquipo, setExpandedEquipo] = useState<string | null>(null)

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

  const inscritosIds = new Set(inscripciones.map(i => i.torneo_id))
  const torneosDisponibles = torneos.filter(t => !inscritosIds.has(t.id))
  const torneosInscritos = torneos.filter(t => inscritosIds.has(t.id))

  const handleOpenTorneo = async (torneo: JugadorTorneo) => {
    setSelectedTorneo(torneo)
    setExpandedEquipo(null)
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

  const handleInscribirse = async (torneoEquipoId: string) => {
    if (!selectedTorneo) return
    try {
      setInscribiendo(true)
      await inscribirseEquipo(selectedTorneo.id, torneoEquipoId)
      setSelectedTorneo(null)
      setNotification({
        open: true, title: 'Inscripcion exitosa',
        message: 'Te inscribiste correctamente al equipo', type: 'success',
      })
      await fetchData()
    } catch (err: any) {
      setNotification({
        open: true, title: 'Error al inscribirse',
        message: err.message || 'No se pudo completar la inscripcion', type: 'error',
      })
    } finally {
      setInscribiendo(false)
    }
  }

  const handleDesinscribirse = async () => {
    if (!selectedTorneo) return
    try {
      setDesinscribiendo(true)
      await desinscribirseEquipo(selectedTorneo.id)
      setShowConfirmSalir(false)
      setSelectedTorneo(null)
      setNotification({
        open: true, title: 'Desinscripcion exitosa',
        message: 'Saliste del equipo correctamente', type: 'success',
      })
      await fetchData()
    } catch (err: any) {
      setShowConfirmSalir(false)
      setNotification({
        open: true, title: 'Error',
        message: err.message || 'No se pudo completar la desinscripcion', type: 'error',
      })
    } finally {
      setDesinscribiendo(false)
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
    const yaInscrito = inscritosIds.has(selectedTorneo.id)
    const miInscripcion = inscripciones.find(i => i.torneo_id === selectedTorneo.id)

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
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(selectedTorneo.estado)}`}>
              {getEstadoLabel(selectedTorneo.estado)}
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

        {/* Mi equipo actual */}
        {yaInscrito && miInscripcion && (
          <div className={`rounded-xl border-2 p-4 ${abierto ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Estas inscrito en: {miInscripcion.equipo_nombre}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 ml-9">Categoria: {miInscripcion.categoria_nombre}</p>
            {abierto && (
              <button
                onClick={() => setShowConfirmSalir(true)}
                className="mt-3 ml-9 flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Salir del equipo
              </button>
            )}
          </div>
        )}

        {/* Equipos */}
        <div>
          <h2 className="text-sm font-bold text-[#617989] dark:text-slate-400 uppercase tracking-wider mb-3">
            Equipos ({equiposTorneo.length})
          </h2>

          {loadingEquipos ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : equiposTorneo.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">group_off</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay equipos inscriptos en este torneo</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {equiposTorneo.map((equipo) => {
                const isExpanded = expandedEquipo === equipo.id
                const esMiEquipo = miInscripcion?.torneo_equipo_id === equipo.id
                return (
                  <div key={equipo.id} className={`bg-white dark:bg-slate-800 rounded-xl border overflow-hidden ${esMiEquipo ? 'border-primary/40 dark:border-primary/30' : 'border-slate-200 dark:border-slate-700'}`}>
                    {/* Header del equipo */}
                    <button
                      onClick={() => setExpandedEquipo(isExpanded ? null : equipo.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
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
                      <span className={`material-symbols-outlined text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {/* Lista de jugadores expandida */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        {equipo.jugadores.length === 0 ? (
                          <p className="text-sm text-slate-400 dark:text-slate-500 p-4 text-center">Sin jugadores inscriptos</p>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {equipo.jugadores.map((jugador) => (
                              <div key={jugador.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-900 dark:text-white truncate">
                                    {jugador.nombre} {jugador.apellido}
                                  </p>
                                </div>
                                {jugador.numero_camiseta && (
                                  <span className="text-xs text-slate-400">#{jugador.numero_camiseta}</span>
                                )}
                                {jugador.capitan && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">C</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Boton inscribirse dentro del equipo */}
                        {abierto && !yaInscrito && (
                          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => handleInscribirse(equipo.id)}
                              disabled={inscribiendo}
                              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg font-bold text-sm transition-colors active:scale-[0.98] bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                            >
                              {inscribiendo ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Inscribiendo...
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-base">person_add</span>
                                  Unirme a este equipo
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal confirmar salir del equipo */}
        {showConfirmSalir && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => !desinscribiendo && setShowConfirmSalir(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 text-2xl">group_remove</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
                Salir del equipo
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                Vas a salir de <span className="font-semibold text-slate-700 dark:text-slate-300">{miInscripcion?.equipo_nombre}</span>. Podras volver a inscribirte mientras las inscripciones sigan abiertas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSalir(false)}
                  disabled={desinscribiendo}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDesinscribirse}
                  disabled={desinscribiendo}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {desinscribiendo ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saliendo...
                    </>
                  ) : (
                    'Salir'
                  )}
                </button>
              </div>
            </div>
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
          Mis Inscripciones ({inscripciones.length})
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}>
                    {getEstadoLabel(torneo.estado)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>{formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}</span>
                </div>
                {torneo.descripcion && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{torneo.descripcion}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className={`flex items-center gap-2 text-xs ${abierto ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
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

      {/* Mis inscripciones */}
      {tab === 'inscritos' && (
        <div className="flex flex-col gap-3">
          {torneosInscritos.map((torneo) => {
            const torneoInscripciones = inscripciones.filter(i => i.torneo_id === torneo.id)
            return (
              <button
                key={torneo.id}
                onClick={() => handleOpenTorneo(torneo)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left hover:border-primary/50 dark:hover:border-primary/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}>
                    {getEstadoLabel(torneo.estado)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>{formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}</span>
                </div>

                {torneoInscripciones.map((inscripcion) => (
                  <div key={inscripcion.id} className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-sm text-primary">groups</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{inscripcion.equipo_nombre}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{inscripcion.categoria_nombre}</span>
                    {inscripcion.capitan && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">C</span>
                    )}
                    <span className="material-symbols-outlined text-slate-400 text-lg ml-auto">chevron_right</span>
                  </div>
                ))}
              </button>
            )
          })}

          {torneosInscritos.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">emoji_events</span>
              <p className="text-slate-500 dark:text-slate-400">No estas inscrito en ningun torneo</p>
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
