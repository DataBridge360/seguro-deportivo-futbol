'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getTorneos, getEquiposInscritos, inscribirEquipo, desinscribirEquipo, getEquipos, getCategorias, generarPartidos } from '@/lib/api'
import type { Torneo, Inscripcion, Equipo, Categoria, InscribirEquipoDTO, GenerarPartidosDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  const [showModalInscripcion, setShowModalInscripcion] = useState(false)
  const [showModalGenerar, setShowModalGenerar] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formInscripcion, setFormInscripcion] = useState<InscribirEquipoDTO>({
    equipo_id: '',
    categoria_id: '',
  })
  const [formGenerar, setFormGenerar] = useState<GenerarPartidosDTO>({
    fecha_inicio: '',
    intervalo_dias: 7,
    hora_inicio: '15:00',
    diferencia_horaria: 120,
    ida_vuelta: false,
    ubicacion: '',
    cancha: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleOpenModalInscripcion = () => {
    setFormInscripcion({ equipo_id: '', categoria_id: '' })
    setErrors({})
    setShowModalInscripcion(true)
  }

  const handleOpenModalGenerar = () => {
    setFormGenerar({
      fecha_inicio: '',
      intervalo_dias: 7,
      hora_inicio: '15:00',
      diferencia_horaria: 120,
      ida_vuelta: false,
      ubicacion: '',
      cancha: '',
    })
    setErrors({})
    setShowModalGenerar(true)
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

  const validateGenerar = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formGenerar.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    }

    if (formGenerar.intervalo_dias < 1) {
      newErrors.intervalo_dias = 'El intervalo debe ser al menos 1 día'
    }

    if (!formGenerar.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es obligatoria'
    } else if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(formGenerar.hora_inicio)) {
      newErrors.hora_inicio = 'Formato inválido (HH:MM)'
    }

    if (formGenerar.diferencia_horaria < 30) {
      newErrors.diferencia_horaria = 'La diferencia horaria debe ser al menos 30 minutos'
    }

    if (inscripciones.length === 0) {
      newErrors.general = 'Debe haber equipos inscritos para generar partidos'
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

  const handleGenerarPartidos = async () => {
    if (!validateGenerar()) return

    try {
      setSubmitting(true)
      const resultado = await generarPartidos(torneoId, formGenerar)
      setShowModalGenerar(false)

      const detalles = resultado.por_categoria
        .map(c => `${c.categoria_nombre}: ${c.partidos} partidos (${c.equipos} equipos)`)
        .join('\n')

      setNotification({
        open: true,
        title: 'Partidos generados',
        message: `Se generaron ${resultado.partidos_creados} partidos exitosamente:\n\n${detalles}`,
        type: 'success'
      })

      // Recargar la página después de 2 segundos para ver los partidos
      setTimeout(() => {
        router.push('/dashboard/club/calendario')
      }, 3000)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al generar partidos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesinscribir = async (inscripcionId: string, equipoNombre: string) => {
    if (!confirm(`¿Estás seguro de desinscribir a "${equipoNombre}" del torneo?`)) {
      return
    }

    try {
      await desinscribirEquipo(inscripcionId)
      setInscripciones(prev => prev.filter(i => i.id !== inscripcionId))
      setNotification({
        open: true,
        title: 'Equipo desinscrito',
        message: `El equipo "${equipoNombre}" fue desinscrito del torneo`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al desinscribir',
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
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getEstadoBadge(torneo.estado)}`}>
              {getEstadoLabel(torneo.estado)}
            </span>
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

          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Inscripciones</p>
            <p className="text-slate-900 dark:text-white">
              {torneo.inscripciones_abiertas ? (
                <span className="text-green-500 font-medium">Abiertas</span>
              ) : (
                <span className="text-red-400 font-medium">Cerradas</span>
              )}
            </p>
          </div>

          {torneo.max_jugadores_por_equipo && (
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Máx. jugadores por equipo</p>
              <p className="text-slate-900 dark:text-white">{torneo.max_jugadores_por_equipo}</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipos inscritos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Equipos inscritos ({inscripciones.length})
          </h2>
          <div className="flex gap-2">
            {inscripciones.length > 0 && (
              <button
                onClick={handleOpenModalGenerar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">casino</span>
                Generar partidos
              </button>
            )}
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
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">groups_off</span>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay equipos inscritos</p>
            <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Inscribí equipos para que puedan participar del torneo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inscripciones.map((inscripcion) => (
              <div
                key={inscripcion.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">shield</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{inscripcion.equipo_nombre}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Categoría: <span className="font-medium text-primary">{inscripcion.categoria_nombre}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDesinscribir(inscripcion.id, inscripcion.equipo_nombre)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-lg text-slate-400 hover:text-red-500">delete</span>
                </button>
              </div>
            ))}
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
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                      {(cat.edad_minima || cat.edad_maxima) &&
                        ` (${cat.edad_minima && cat.edad_maxima ? `${cat.edad_minima}-${cat.edad_maxima}` :
                             cat.edad_minima ? `${cat.edad_minima}+` :
                             `hasta ${cat.edad_maxima}`} años)`
                      }
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

      {/* Modal generar partidos */}
      {showModalGenerar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalGenerar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Generar partidos automáticamente
            </h3>

            {errors.general && (
              <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Fecha de inicio <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formGenerar.fecha_inicio}
                    onChange={(val) => setFormGenerar(prev => ({ ...prev, fecha_inicio: val }))}
                    placeholder="Seleccionar fecha"
                    hasError={!!errors.fecha_inicio}
                  />
                  {errors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{errors.fecha_inicio}</p>}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Intervalo (días) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formGenerar.intervalo_dias}
                    onChange={(e) => setFormGenerar(prev => ({ ...prev, intervalo_dias: parseInt(e.target.value) || 1 }))}
                    className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                      errors.intervalo_dias ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.intervalo_dias && <p className="text-red-400 text-xs mt-1">{errors.intervalo_dias}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ej: 7 = partidos cada semana</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Hora de inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formGenerar.hora_inicio}
                    onChange={(e) => setFormGenerar(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                      errors.hora_inicio ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.hora_inicio && <p className="text-red-400 text-xs mt-1">{errors.hora_inicio}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hora del primer partido</p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Diferencia horaria (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="30"
                    step="15"
                    value={formGenerar.diferencia_horaria}
                    onChange={(e) => setFormGenerar(prev => ({ ...prev, diferencia_horaria: parseInt(e.target.value) || 30 }))}
                    className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                      errors.diferencia_horaria ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  {errors.diferencia_horaria && <p className="text-red-400 text-xs mt-1">{errors.diferencia_horaria}</p>}
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ej: 120 = 2 horas entre partidos</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formGenerar.ubicacion}
                  onChange={(e) => setFormGenerar(prev => ({ ...prev, ubicacion: e.target.value }))}
                  placeholder="Ej: Estadio Municipal"
                  maxLength={200}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Cancha
                </label>
                <input
                  type="text"
                  value={formGenerar.cancha}
                  onChange={(e) => setFormGenerar(prev => ({ ...prev, cancha: e.target.value }))}
                  placeholder="Ej: Cancha 1"
                  maxLength={100}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <input
                  type="checkbox"
                  id="ida_vuelta"
                  checked={formGenerar.ida_vuelta}
                  onChange={(e) => setFormGenerar(prev => ({ ...prev, ida_vuelta: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary focus:ring-primary/50"
                />
                <label htmlFor="ida_vuelta" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer flex-1">
                  <span className="font-medium">Ida y vuelta</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Genera todos contra todos en formato ida y vuelta (duplica los partidos)
                  </p>
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-medium">ℹ️ Información:</span>
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                  <li>Se generarán partidos entre equipos de la misma categoría</li>
                  <li>Algoritmo Round-Robin (todos contra todos)</li>
                  <li>Los partidos se distribuyen automáticamente en el tiempo</li>
                  <li>Equipos inscritos: {inscripciones.length}</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModalGenerar(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerarPartidos}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">casino</span>
                    Generar partidos
                  </>
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
