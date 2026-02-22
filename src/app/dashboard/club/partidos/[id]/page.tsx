'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPartidoDetalle, updatePartido, deletePartido } from '@/lib/api'
import type { PartidoDetalle, UpdatePartidoDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'

function getEstadoBadge(estado: PartidoDetalle['estado']) {
  switch (estado) {
    case 'programado':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'en_curso':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'finalizado':
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
    case 'suspendido':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    case 'cancelado':
      return 'bg-red-500/10 text-red-500 border-red-500/20'
  }
}

function getEstadoLabel(estado: PartidoDetalle['estado']) {
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

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function DetallePartidoPage() {
  const router = useRouter()
  const params = useParams()
  const partidoId = params.id as string

  const [partido, setPartido] = useState<PartidoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Modals
  const [showModalResultado, setShowModalResultado] = useState(false)
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [showModalCancelar, setShowModalCancelar] = useState(false)
  const [showModalEliminar, setShowModalEliminar] = useState(false)

  // Form states
  const [resultadoLocal, setResultadoLocal] = useState(0)
  const [resultadoVisitante, setResultadoVisitante] = useState(0)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [cancha, setCancha] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [razonCancelacion, setRazonCancelacion] = useState('')

  const [notification, setNotification] = useState<{
    open: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info'
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadPartido()
  }, [partidoId])

  const loadPartido = async () => {
    try {
      setLoading(true)
      const data = await getPartidoDetalle(partidoId)
      setPartido(data)

      // Inicializar form states
      setResultadoLocal(data.resultado_local || 0)
      setResultadoVisitante(data.resultado_visitante || 0)
      setFecha(data.fecha)
      setHora(data.hora)
      setUbicacion(data.ubicacion || '')
      setCancha(data.cancha || '')
      setObservaciones(data.observaciones || '')
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar partido',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleActualizarResultado = async () => {
    try {
      setSubmitting(true)

      const updateData: UpdatePartidoDTO = {
        estado: 'finalizado',
        resultado_local: resultadoLocal,
        resultado_visitante: resultadoVisitante
      }

      await updatePartido(partidoId, updateData)

      setNotification({
        open: true,
        title: 'Resultado actualizado',
        message: 'El resultado se guardó correctamente.',
        type: 'success'
      })

      setShowModalResultado(false)
      await loadPartido()
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al actualizar resultado',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleActualizarPartido = async () => {
    try {
      setSubmitting(true)

      const updateData: UpdatePartidoDTO = {
        fecha,
        hora,
        ...(ubicacion && { ubicacion }),
        ...(cancha && { cancha }),
        ...(observaciones && { observaciones })
      }

      await updatePartido(partidoId, updateData)

      setNotification({
        open: true,
        title: 'Partido actualizado',
        message: 'Los cambios se guardaron correctamente.',
        type: 'success'
      })

      setShowModalEditar(false)
      await loadPartido()
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al actualizar partido',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelarPartido = async () => {
    try {
      setSubmitting(true)

      await updatePartido(partidoId, {
        estado: 'cancelado',
        observaciones: razonCancelacion
      })

      setNotification({
        open: true,
        title: 'Partido cancelado',
        message: 'El partido fue cancelado exitosamente.',
        type: 'success'
      })

      setShowModalCancelar(false)
      await loadPartido()
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cancelar partido',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEliminarPartido = async () => {
    try {
      setSubmitting(true)

      await deletePartido(partidoId)

      setNotification({
        open: true,
        title: 'Partido eliminado',
        message: 'El partido fue eliminado permanentemente.',
        type: 'success'
      })

      setShowModalEliminar(false)
      setTimeout(() => {
        router.push('/dashboard/club/calendario')
      }, 1500)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al eliminar partido',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando partido...</p>
        </div>
      </div>
    )
  }

  if (!partido) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">error</span>
        <p className="mt-3 text-slate-500 dark:text-slate-400">Partido no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/club/calendario')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Detalle del Partido</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{partido.torneo.nombre}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getEstadoBadge(partido.estado)}`}>
          {getEstadoLabel(partido.estado)}
        </div>
      </div>

      {/* Enfrentamiento */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-3 gap-8 items-center">
          {/* Equipo Local */}
          <div className="text-center">
            {partido.equipo_local.logo_url && (
              <img
                src={partido.equipo_local.logo_url}
                alt={partido.equipo_local.nombre}
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
            )}
            {!partido.equipo_local.logo_url && (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: partido.equipo_local.color_primario || '#0066cc' }}
              >
                {partido.equipo_local.nombre.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{partido.equipo_local.nombre}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Local</p>
          </div>

          {/* Resultado / VS */}
          <div className="text-center">
            {partido.estado === 'finalizado' && partido.resultado_local !== null && partido.resultado_visitante !== null ? (
              <div className="text-5xl font-bold text-slate-900 dark:text-white">
                {partido.resultado_local} - {partido.resultado_visitante}
              </div>
            ) : (
              <div className="text-3xl font-bold text-slate-500 dark:text-slate-400">VS</div>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>{formatDate(partido.fecha)} - {partido.hora}</span>
            </div>
            {partido.ubicacion && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">location_on</span>
                <span>{partido.ubicacion}{partido.cancha && ` - ${partido.cancha}`}</span>
              </div>
            )}
          </div>

          {/* Equipo Visitante */}
          <div className="text-center">
            {partido.equipo_visitante.logo_url && (
              <img
                src={partido.equipo_visitante.logo_url}
                alt={partido.equipo_visitante.nombre}
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
            )}
            {!partido.equipo_visitante.logo_url && (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: partido.equipo_visitante.color_primario || '#cc0000' }}
              >
                {partido.equipo_visitante.nombre.charAt(0)}
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{partido.equipo_visitante.nombre}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visitante</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          {partido.estado !== 'finalizado' && partido.estado !== 'cancelado' && (
            <button
              onClick={() => setShowModalResultado(true)}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">sports_score</span>
              Cargar Resultado
            </button>
          )}
          {partido.estado !== 'cancelado' && (
            <button
              onClick={() => setShowModalEditar(true)}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Editar
            </button>
          )}
          {partido.estado !== 'cancelado' && (
            <button
              onClick={() => setShowModalCancelar(true)}
              className="px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">cancel</span>
              Cancelar
            </button>
          )}
          <button
            onClick={() => setShowModalEliminar(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            Eliminar
          </button>
        </div>
      </div>

      {/* Observaciones */}
      {partido.observaciones && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">info</span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observaciones</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{partido.observaciones}</p>
            </div>
          </div>
        </div>
      )}

      {/* Planteles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plantel Local */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">groups</span>
            Plantel {partido.equipo_local.nombre}
          </h3>
          {partido.equipo_local.plantel.length > 0 ? (
            <div className="space-y-3">
              {partido.equipo_local.plantel.map((jugador) => (
                <div
                  key={jugador.jugador_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                >
                  {jugador.foto_url ? (
                    <img
                      src={jugador.foto_url}
                      alt={jugador.nombre_completo}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {jugador.nombre_completo}
                      </p>
                      {jugador.capitan && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500 text-white rounded font-semibold">C</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {jugador.posicion || 'Sin posición'} {jugador.numero_camiseta && `• #${jugador.numero_camiseta}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">person_off</span>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sin jugadores inscritos</p>
            </div>
          )}
        </div>

        {/* Plantel Visitante */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">groups</span>
            Plantel {partido.equipo_visitante.nombre}
          </h3>
          {partido.equipo_visitante.plantel.length > 0 ? (
            <div className="space-y-3">
              {partido.equipo_visitante.plantel.map((jugador) => (
                <div
                  key={jugador.jugador_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                >
                  {jugador.foto_url ? (
                    <img
                      src={jugador.foto_url}
                      alt={jugador.nombre_completo}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {jugador.nombre_completo}
                      </p>
                      {jugador.capitan && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500 text-white rounded font-semibold">C</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {jugador.posicion || 'Sin posición'} {jugador.numero_camiseta && `• #${jugador.numero_camiseta}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">person_off</span>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sin jugadores inscritos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Resultado */}
      {showModalResultado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModalResultado(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cargar Resultado</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {partido.equipo_local.nombre}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultadoLocal}
                    onChange={(e) => setResultadoLocal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-center text-2xl font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="text-center text-2xl font-bold text-slate-500 dark:text-slate-400">-</div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {partido.equipo_visitante.nombre}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resultadoVisitante}
                    onChange={(e) => setResultadoVisitante(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-center text-2xl font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModalResultado(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarResultado}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar Resultado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showModalEditar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModalEditar(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Editar Partido</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha</label>
                  <DatePicker value={fecha} onChange={setFecha} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hora</label>
                  <input
                    type="text"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    placeholder="15:30"
                    className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ubicación</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cancha</label>
                <input
                  type="text"
                  value={cancha}
                  onChange={(e) => setCancha(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModalEditar(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarPartido}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cancelar */}
      {showModalCancelar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModalCancelar(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cancelar Partido</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              El partido quedará marcado como cancelado pero se mantendrá en el historial.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Razón de cancelación
              </label>
              <textarea
                value={razonCancelacion}
                onChange={(e) => setRazonCancelacion(e.target.value)}
                placeholder="Ej: Mal tiempo, falta de jugadores..."
                rows={3}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModalCancelar(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleCancelarPartido}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Cancelando...' : 'Cancelar Partido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showModalEliminar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModalEliminar(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-full">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Eliminar Partido</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Esta acción es <strong>permanente</strong> y no se puede deshacer. El partido desaparecerá completamente de la base de datos.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Recomendación:</strong> Para mantener el historial, usa la opción "Cancelar Partido" en vez de eliminar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModalEliminar(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleEliminarPartido}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Eliminando...' : 'Eliminar Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
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
