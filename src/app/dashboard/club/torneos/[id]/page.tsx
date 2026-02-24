'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getTorneos, getEquiposInscritos, inscribirEquipo, desinscribirEquipo, getEquipos, getCategorias, toggleInscripciones, deleteTorneo, getJugadoresEquipoTorneo, agregarJugadorEquipoTorneo, quitarJugadorEquipoTorneo, getJugadores } from '@/lib/api'
import type { JugadorResponse } from '@/lib/api'
import type { Torneo, Inscripcion, Equipo, Categoria, InscribirEquipoDTO, JugadorEquipoTorneo, AgregarJugadorEquipoDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

function formatDate(dateString: string) {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

function getEstadoBadge(estado: Torneo['estado']) {
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

export default function DetalleTorneoPage() {
  const router = useRouter()
  const params = useParams()
  const torneoId = params.id as string

  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [equiposDisponibles, setEquiposDisponibles] = useState<Equipo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingInscripciones, setTogglingInscripciones] = useState(false)
  const [showModalInscripcion, setShowModalInscripcion] = useState(false)
  const [showConfirmDesinscribir, setShowConfirmDesinscribir] = useState<{ id: string; nombre: string } | null>(null)
  const [showConfirmEliminarTorneo, setShowConfirmEliminarTorneo] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formInscripcion, setFormInscripcion] = useState<InscribirEquipoDTO>({
    equipo_id: '',
    categoria_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Jugadores en equipo-torneo
  const [expandedEquipo, setExpandedEquipo] = useState<string | null>(null)
  const [jugadoresPorEquipo, setJugadoresPorEquipo] = useState<Record<string, JugadorEquipoTorneo[]>>({})
  const [loadingJugadores, setLoadingJugadores] = useState<string | null>(null)
  const [showModalAgregarJugador, setShowModalAgregarJugador] = useState<{ equipoId: string; equipoNombre: string } | null>(null)
  const [showConfirmQuitarJugador, setShowConfirmQuitarJugador] = useState<{ equipoId: string; jugador: JugadorEquipoTorneo } | null>(null)
  const [jugadoresClub, setJugadoresClub] = useState<JugadorResponse[]>([])
  const [formAgregarJugador, setFormAgregarJugador] = useState<AgregarJugadorEquipoDTO>({ jugador_id: '' })

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadData()
  }, [torneoId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar torneo, inscripciones, equipos y categorías en paralelo
      const [torneosData, inscripcionesData, equiposData, categoriasData] = await Promise.all([
        getTorneos(),
        getEquiposInscritos(torneoId),
        getEquipos(),
        getCategorias(),
      ])

      const torneoActual = torneosData.find(t => t.id === torneoId)
      if (!torneoActual) {
        setNotification({
          open: true,
          title: 'Torneo no encontrado',
          message: 'El torneo solicitado no existe',
          type: 'error'
        })
        router.push('/dashboard/club/torneos')
        return
      }

      setTorneo(torneoActual)
      setInscripciones(inscripcionesData)
      setEquiposDisponibles(equiposData)
      setCategorias(categoriasData)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar datos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Compute effective inscription status
  const getInscripcionesEfectivas = (): boolean => {
    if (!torneo) return false
    const hoy = new Date().toISOString().split('T')[0]
    // Hard cutoff: if inscripcion_fin passed, always closed
    if (torneo.inscripcion_fin && hoy > torneo.inscripcion_fin) return false
    return torneo.inscripciones_abiertas
  }

  const handleToggleInscripciones = async () => {
    if (!torneo) return
    const nuevoEstado = !getInscripcionesEfectivas()

    try {
      setTogglingInscripciones(true)
      const updated = await toggleInscripciones(torneo.id, nuevoEstado)
      setTorneo(updated)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cambiar inscripciones',
        type: 'error'
      })
    } finally {
      setTogglingInscripciones(false)
    }
  }

  const handleEliminarTorneo = async () => {
    if (!torneo) return
    if (!deletePassword.trim()) {
      setDeleteError('Ingresá tu contraseña')
      return
    }
    try {
      setSubmitting(true)
      await deleteTorneo(torneo.id, deletePassword)
      setShowConfirmEliminarTorneo(false)
      setDeletePassword('')
      setDeleteError('')
      setNotification({
        open: true,
        title: 'Torneo eliminado',
        message: `El torneo "${torneo.nombre}" fue eliminado`,
        type: 'success'
      })
      setTimeout(() => {
        router.push('/dashboard/club/torneos')
      }, 1500)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      if (msg.toLowerCase().includes('contraseña')) {
        setDeleteError('Contraseña incorrecta')
      } else {
        setShowConfirmEliminarTorneo(false)
        setDeletePassword('')
        setDeleteError('')
        setNotification({
          open: true,
          title: 'Error al eliminar',
          message: msg,
          type: 'error'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenModalInscripcion = () => {
    setFormInscripcion({ equipo_id: '', categoria_id: '' })
    setErrors({})
    setShowModalInscripcion(true)
  }

  const validateInscripcion = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formInscripcion.equipo_id) {
      newErrors.equipo_id = 'Debe seleccionar un equipo'
    } else {
      // Verificar si el equipo ya está inscrito
      const yaInscrito = inscripciones.some(i => i.equipo_id === formInscripcion.equipo_id)
      if (yaInscrito) {
        newErrors.equipo_id = 'Este equipo ya está inscrito en el torneo'
      }
    }

    if (!formInscripcion.categoria_id) {
      newErrors.categoria_id = 'Debe seleccionar una categoría'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInscribir = async () => {
    if (!validateInscripcion()) return

    try {
      setSubmitting(true)
      const nuevaInscripcion = await inscribirEquipo(torneoId, formInscripcion)
      setInscripciones(prev => [...prev, nuevaInscripcion])
      setShowModalInscripcion(false)
      setNotification({
        open: true,
        title: 'Equipo inscrito',
        message: `El equipo fue inscrito exitosamente en la categoría ${nuevaInscripcion.categoria_nombre}`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al inscribir',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesinscribir = async () => {
    if (!showConfirmDesinscribir) return

    try {
      await desinscribirEquipo(showConfirmDesinscribir.id)
      setInscripciones(prev => prev.filter(i => i.id !== showConfirmDesinscribir.id))
      setShowConfirmDesinscribir(null)
      setNotification({
        open: true,
        title: 'Equipo desinscrito',
        message: `El equipo "${showConfirmDesinscribir.nombre}" fue desinscrito del torneo`,
        type: 'success'
      })
    } catch (error) {
      setShowConfirmDesinscribir(null)
      setNotification({
        open: true,
        title: 'Error al desinscribir',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    }
  }

  const handleToggleEquipo = async (equipoId: string) => {
    if (expandedEquipo === equipoId) {
      setExpandedEquipo(null)
      return
    }

    setExpandedEquipo(equipoId)

    // Lazy load jugadores if not already loaded
    if (!jugadoresPorEquipo[equipoId]) {
      try {
        setLoadingJugadores(equipoId)
        const jugadores = await getJugadoresEquipoTorneo(torneoId, equipoId)
        setJugadoresPorEquipo(prev => ({ ...prev, [equipoId]: jugadores }))
      } catch (error) {
        setNotification({
          open: true,
          title: 'Error al cargar jugadores',
          message: error instanceof Error ? error.message : 'Error desconocido',
          type: 'error'
        })
      } finally {
        setLoadingJugadores(null)
      }
    }
  }

  const handleOpenAgregarJugador = async (equipoId: string, equipoNombre: string) => {
    setFormAgregarJugador({ jugador_id: '' })
    setErrors({})
    setShowModalAgregarJugador({ equipoId, equipoNombre })

    // Load club players if not loaded
    if (jugadoresClub.length === 0) {
      try {
        const jugadores = await getJugadores()
        setJugadoresClub(jugadores)
      } catch {
        // Silently fail, user will see empty list
      }
    }
  }

  const handleAgregarJugador = async () => {
    if (!showModalAgregarJugador) return

    if (!formAgregarJugador.jugador_id) {
      setErrors({ jugador_id: 'Debe seleccionar un jugador' })
      return
    }

    try {
      setSubmitting(true)
      const nuevo = await agregarJugadorEquipoTorneo(torneoId, showModalAgregarJugador.equipoId, formAgregarJugador)
      setJugadoresPorEquipo(prev => ({
        ...prev,
        [showModalAgregarJugador.equipoId]: [...(prev[showModalAgregarJugador.equipoId] || []), nuevo],
      }))
      setShowModalAgregarJugador(null)
      setNotification({
        open: true,
        title: 'Jugador agregado',
        message: `${nuevo.nombre_completo} fue agregado al equipo`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al agregar jugador',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuitarJugador = async () => {
    if (!showConfirmQuitarJugador) return

    try {
      await quitarJugadorEquipoTorneo(torneoId, showConfirmQuitarJugador.equipoId, showConfirmQuitarJugador.jugador.jugador_id)
      setJugadoresPorEquipo(prev => ({
        ...prev,
        [showConfirmQuitarJugador.equipoId]: (prev[showConfirmQuitarJugador.equipoId] || []).filter(
          j => j.jugador_id !== showConfirmQuitarJugador.jugador.jugador_id
        ),
      }))
      const nombre = showConfirmQuitarJugador.jugador.nombre_completo
      setShowConfirmQuitarJugador(null)
      setNotification({
        open: true,
        title: 'Jugador quitado',
        message: `${nombre} fue quitado del equipo`,
        type: 'success'
      })
    } catch (error) {
      setShowConfirmQuitarJugador(null)
      setNotification({
        open: true,
        title: 'Error al quitar jugador',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (!torneo) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm mb-2"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </button>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{torneo.nombre}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadge(torneo.estado)}`}>
                {getEstadoLabel(torneo.estado)}
              </span>
              <button
                onClick={() => setShowConfirmEliminarTorneo(true)}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                title="Eliminar torneo"
              >
                <span className="material-symbols-outlined text-lg text-slate-400 hover:text-red-500">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info del torneo */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Información del torneo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneo.descripcion && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Descripción</p>
              <p className="text-slate-900 dark:text-white">{torneo.descripcion}</p>
            </div>
          )}

          {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Período de inscripción</p>
              <p className="text-slate-900 dark:text-white">
                {torneo.inscripcion_inicio ? formatDate(torneo.inscripcion_inicio) : '—'}
                {' - '}
                {torneo.inscripcion_fin ? formatDate(torneo.inscripcion_fin) : '—'}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Máx. jugadores por equipo</p>
            <p className="text-slate-900 dark:text-white">{torneo.max_jugadores_por_equipo}</p>
          </div>
        </div>

        {/* Switch inscripciones */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {(() => {
            const efectiva = getInscripcionesEfectivas()
            const hoy = new Date().toISOString().split('T')[0]
            const vencido = torneo.inscripcion_fin && hoy > torneo.inscripcion_fin
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg text-slate-400">how_to_reg</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Inscripciones</p>
                    <p className={`text-xs font-semibold ${efectiva ? 'text-green-500' : 'text-red-400'}`}>
                      {vencido ? 'Cerradas (fecha de cierre vencida)' : efectiva ? 'Abiertas' : 'Cerradas'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleInscripciones}
                  disabled={togglingInscripciones || !!vencido}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    efectiva ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      efectiva ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Equipos inscritos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Equipos inscritos ({inscripciones.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleOpenModalInscripcion}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Inscribir equipo
            </button>
          </div>
        </div>

        {inscripciones.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">groups</span>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay equipos inscritos</p>
            <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Inscribí equipos para que puedan participar del torneo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inscripciones.map((inscripcion) => {
              const isExpanded = expandedEquipo === inscripcion.equipo_id
              const jugadores = jugadoresPorEquipo[inscripcion.equipo_id] || []
              const isLoadingJugadores = loadingJugadores === inscripcion.equipo_id

              return (
                <div
                  key={inscripcion.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Header del equipo */}
                  <div
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleEquipo(inscripcion.equipo_id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">shield</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{inscripcion.equipo_nombre}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Categoría: <span className="font-medium text-primary">{inscripcion.categoria_nombre}</span>
                          {jugadoresPorEquipo[inscripcion.equipo_id] && (
                            <span className="ml-2 text-slate-400">
                              · {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowConfirmDesinscribir({ id: inscripcion.id, nombre: inscripcion.equipo_nombre }) }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg text-slate-400 hover:text-red-500">delete</span>
                      </button>
                      <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Panel expandible de jugadores */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/30">
                      {isLoadingJugadores ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Cargando jugadores...</span>
                        </div>
                      ) : (
                        <>
                          {jugadores.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                              No hay jugadores agregados a este equipo
                            </p>
                          ) : (
                            <div className="space-y-2 mb-3">
                              {jugadores.map((jugador) => (
                                <div
                                  key={jugador.id}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                >
                                  <div className="flex items-center gap-3">
                                    {jugador.foto_url ? (
                                      <img
                                        src={jugador.foto_url}
                                        alt={jugador.nombre_completo}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {jugador.nombre_completo}
                                        {jugador.capitan && (
                                          <span className="ml-1.5 text-xs font-semibold text-amber-500">(C)</span>
                                        )}
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {[
                                          jugador.posicion,
                                          jugador.numero_camiseta != null ? `#${jugador.numero_camiseta}` : null,
                                        ].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setShowConfirmQuitarJugador({ equipoId: inscripcion.equipo_id, jugador })}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-base text-slate-400 hover:text-red-500">close</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenAgregarJugador(inscripcion.equipo_id, inscripcion.equipo_nombre) }}
                            className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Agregar jugador
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal inscribir equipo */}
      {showModalInscripcion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalInscripcion(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Inscribir equipo al torneo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Equipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formInscripcion.equipo_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, equipo_id: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.equipo_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Seleccionar equipo</option>
                  {equiposDisponibles
                    .filter(e => e.activo)
                    .map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.nombre}
                      </option>
                    ))}
                </select>
                {errors.equipo_id && <p className="text-red-400 text-xs mt-1">{errors.equipo_id}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formInscripcion.categoria_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, categoria_id: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.categoria_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {(torneo?.categorias && torneo.categorias.length > 0
                    ? categorias.filter(cat => torneo.categorias!.some(tc => tc.id === cat.id))
                    : categorias
                  ).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && <p className="text-red-400 text-xs mt-1">{errors.categoria_id}</p>}
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">Nota:</span> Un equipo puede inscribirse en una sola categoría por torneo.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModalInscripcion(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInscribir}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Inscribiendo...
                  </>
                ) : (
                  'Inscribir equipo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación desinscribir */}
      {showConfirmDesinscribir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmDesinscribir(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Desinscribir equipo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de desinscribir a <span className="font-semibold text-slate-900 dark:text-white">"{showConfirmDesinscribir.nombre}"</span> del torneo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDesinscribir(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesinscribir}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Desinscribir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar torneo */}
      {showConfirmEliminarTorneo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { if (!submitting) { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') } }}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar torneo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              ¿Estás seguro de eliminar el torneo <span className="font-semibold text-slate-900 dark:text-white">"{torneo.nombre}"</span>? Ya no será visible para el club ni los jugadores.
            </p>
            <div className="mb-5">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                  deleteError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') }}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarTorneo}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar jugador al equipo */}
      {showModalAgregarJugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalAgregarJugador(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Agregar jugador a {showModalAgregarJugador.equipoNombre}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Jugador <span className="text-red-500">*</span>
                </label>
                <select
                  value={formAgregarJugador.jugador_id}
                  onChange={(e) => setFormAgregarJugador(prev => ({ ...prev, jugador_id: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.jugador_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Seleccionar jugador</option>
                  {jugadoresClub
                    .filter(j => {
                      // Filter out jugadores already in the team for this torneo
                      const yaAgregados = jugadoresPorEquipo[showModalAgregarJugador.equipoId] || []
                      return !yaAgregados.some(ya => ya.jugador_id === j.id)
                    })
                    .map(j => (
                      <option key={j.id} value={j.id}>
                        {j.nombre} {j.apellido}
                      </option>
                    ))}
                </select>
                {errors.jugador_id && <p className="text-red-400 text-xs mt-1">{errors.jugador_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Nro. camiseta
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formAgregarJugador.numero_camiseta || ''}
                    onChange={(e) => setFormAgregarJugador(prev => ({ ...prev, numero_camiseta: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Ej: 10"
                    className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Posición
                  </label>
                  <select
                    value={formAgregarJugador.posicion || ''}
                    onChange={(e) => setFormAgregarJugador(prev => ({ ...prev, posicion: e.target.value || undefined }))}
                    className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">Sin definir</option>
                    <option value="Arquero">Arquero</option>
                    <option value="Defensor">Defensor</option>
                    <option value="Mediocampista">Mediocampista</option>
                    <option value="Delantero">Delantero</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formAgregarJugador.capitan || false}
                  onChange={(e) => setFormAgregarJugador(prev => ({ ...prev, capitan: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Capitán</span>
              </label>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModalAgregarJugador(null)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarJugador}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Agregando...
                  </>
                ) : (
                  'Agregar jugador'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación quitar jugador */}
      {showConfirmQuitarJugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmQuitarJugador(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">person_remove</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quitar jugador</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de quitar a <span className="font-semibold text-slate-900 dark:text-white">"{showConfirmQuitarJugador.jugador.nombre_completo}"</span> del equipo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuitarJugador(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuitarJugador}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Quitar
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
