'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/ui/DatePicker'
import NotificationModal from '@/components/ui/NotificationModal'
import { getTorneos, getEquipos, createPartido, generarPartidos } from '@/lib/api'
import type { Torneo, Equipo, GenerarPartidosResponse } from '@/types/club'

type ModoCreacion = 'manual' | 'automatico'

interface FormErrors {
  [key: string]: string
}

export default function NuevoPartidoPage() {
  const router = useRouter()

  const [modo, setModo] = useState<ModoCreacion>('manual')
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form Manual
  const [torneoId, setTorneoId] = useState('')
  const [equipoLocalId, setEquipoLocalId] = useState('')
  const [equipoVisitanteId, setEquipoVisitanteId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [cancha, setCancha] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Form Automático
  const [torneoIdAuto, setTorneoIdAuto] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [intervaloDias, setIntervaloDias] = useState(7)
  const [horaInicio, setHoraInicio] = useState('15:00')
  const [diferenciaHoraria, setDiferenciaHoraria] = useState(120)
  const [idaVuelta, setIdaVuelta] = useState(false)
  const [ubicacionAuto, setUbicacionAuto] = useState('')
  const [canchaAuto, setCanchaAuto] = useState('')

  // Preview de generación automática
  const [previewData, setPreviewData] = useState<GenerarPartidosResponse | null>(null)

  const [errors, setErrors] = useState<FormErrors>({})
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
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [torneosData, equiposData] = await Promise.all([
        getTorneos(),
        getEquipos()
      ])
      setTorneos(torneosData)
      setEquipos(equiposData)
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

  const validateManual = () => {
    const newErrors: FormErrors = {}

    if (!torneoId) newErrors.torneo_id = 'Seleccioná un torneo'
    if (!equipoLocalId) newErrors.equipo_local_id = 'Seleccioná el equipo local'
    if (!equipoVisitanteId) newErrors.equipo_visitante_id = 'Seleccioná el equipo visitante'

    if (equipoLocalId && equipoVisitanteId && equipoLocalId === equipoVisitanteId) {
      newErrors.equipo_visitante_id = 'El equipo visitante debe ser diferente al local'
    }

    if (!fecha) newErrors.fecha = 'La fecha es obligatoria'

    if (!hora.trim()) {
      newErrors.hora = 'La hora es obligatoria'
    } else {
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!horaRegex.test(hora)) {
        newErrors.hora = 'Formato inválido. Usar HH:MM (ej: 15:30)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAutomatico = () => {
    const newErrors: FormErrors = {}

    if (!torneoIdAuto) newErrors.torneo_id_auto = 'Seleccioná un torneo'
    if (!fechaInicio) newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    if (!horaInicio.trim()) {
      newErrors.hora_inicio = 'La hora de inicio es obligatoria'
    } else {
      const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!horaRegex.test(horaInicio)) {
        newErrors.hora_inicio = 'Formato inválido. Usar HH:MM (ej: 15:00)'
      }
    }
    if (intervaloDias < 1) newErrors.intervalo_dias = 'Debe ser al menos 1 día'
    if (diferenciaHoraria < 1) newErrors.diferencia_horaria = 'Debe ser al menos 1 minuto'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateManual()) return

    try {
      setSubmitting(true)

      await createPartido({
        torneo_id: torneoId,
        equipo_local_id: equipoLocalId,
        equipo_visitante_id: equipoVisitanteId,
        fecha,
        hora,
        ...(ubicacion && { ubicacion }),
        ...(cancha && { cancha }),
        ...(observaciones && { observaciones })
      })

      setNotification({
        open: true,
        title: 'Partido creado',
        message: 'El partido se programó correctamente.',
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al crear partido',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerarAutomatico = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAutomatico()) return

    try {
      setSubmitting(true)

      const resultado = await generarPartidos(torneoIdAuto, {
        fecha_inicio: fechaInicio,
        intervalo_dias: intervaloDias,
        hora_inicio: horaInicio,
        diferencia_horaria: diferenciaHoraria,
        ida_vuelta: idaVuelta,
        ...(ubicacionAuto && { ubicacion: ubicacionAuto }),
        ...(canchaAuto && { cancha: canchaAuto })
      })

      setPreviewData(resultado)

      setNotification({
        open: true,
        title: '¡Partidos generados!',
        message: `Se crearon ${resultado.partidos_creados} partidos exitosamente.`,
        type: 'success'
      })
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

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }))
    if (notification.type === 'success') {
      router.push('/dashboard/club/calendario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nuevo Partido
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Creá un partido individual o generá múltiples partidos automáticamente
        </p>
      </div>

      {/* Tabs para elegir modo */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => {
            setModo('manual')
            setErrors({})
            setPreviewData(null)
          }}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            modo === 'manual'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">edit_square</span>
          Manual
        </button>
        <button
          onClick={() => {
            setModo('automatico')
            setErrors({})
            setPreviewData(null)
          }}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
            modo === 'automatico'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">auto_awesome</span>
          Automático (Round-Robin)
        </button>
      </div>

      {/* Formulario Manual */}
      {modo === 'manual' && (
        <form
          onSubmit={handleSubmitManual}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
        >
          {/* Torneo */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Torneo *
            </label>
            <select
              value={torneoId}
              onChange={(e) => {
                setTorneoId(e.target.value)
                if (errors.torneo_id) {
                const { torneo_id, ...rest } = errors
                setErrors(rest)
              }
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.torneo_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar torneo</option>
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {errors.torneo_id && <p className="text-red-400 text-xs mt-1">{errors.torneo_id}</p>}
          </div>

          {/* Equipos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Equipo Local *
              </label>
              <select
                value={equipoLocalId}
                onChange={(e) => {
                  setEquipoLocalId(e.target.value)
                  if (errors.equipo_local_id) {
                    const { equipo_local_id, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                  errors.equipo_local_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
              {errors.equipo_local_id && <p className="text-red-400 text-xs mt-1">{errors.equipo_local_id}</p>}
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Equipo Visitante *
              </label>
              <select
                value={equipoVisitanteId}
                onChange={(e) => {
                  setEquipoVisitanteId(e.target.value)
                  if (errors.equipo_visitante_id) {
                    const { equipo_visitante_id, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                  errors.equipo_visitante_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <option value="">Seleccionar equipo</option>
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.nombre}
                  </option>
                ))}
              </select>
              {errors.equipo_visitante_id && <p className="text-red-400 text-xs mt-1">{errors.equipo_visitante_id}</p>}
            </div>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Fecha *
              </label>
              <DatePicker
                value={fecha}
                onChange={(val) => {
                  setFecha(val)
                  if (errors.fecha) {
                    const { fecha, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                placeholder="Seleccionar fecha"
                hasError={!!errors.fecha}
              />
              {errors.fecha && <p className="text-red-400 text-xs mt-1">{errors.fecha}</p>}
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Hora *
              </label>
              <input
                type="text"
                value={hora}
                onChange={(e) => {
                  setHora(e.target.value)
                  if (errors.hora) {
                    const { hora, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                placeholder="15:30"
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                  errors.hora ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.hora && <p className="text-red-400 text-xs mt-1">{errors.hora}</p>}
            </div>
          </div>

          {/* Ubicación + Cancha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Ubicación
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Estadio Municipal"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Cancha
              </label>
              <input
                type="text"
                value={cancha}
                onChange={(e) => setCancha(e.target.value)}
                placeholder="Cancha 1"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/club/calendario')}
              className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Guardando...' : 'Crear Partido'}
            </button>
          </div>
        </form>
      )}

      {/* Formulario Automático */}
      {modo === 'automatico' && (
        <>
          <form
            onSubmit={handleGenerarAutomatico}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
          >
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">info</span>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Generación automática con Round-Robin</p>
                  <p className="text-xs opacity-90">
                    El sistema generará automáticamente todos los partidos enfrentando a todos los equipos inscritos en el torneo (por categoría).
                  </p>
                </div>
              </div>
            </div>

            {/* Torneo */}
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Torneo *
              </label>
              <select
                value={torneoIdAuto}
                onChange={(e) => {
                  const selectedId = e.target.value
                  setTorneoIdAuto(selectedId)

                  // Auto-completar fecha de inicio con la fecha del torneo
                  if (selectedId) {
                    const torneoSeleccionado = torneos.find(t => t.id === selectedId)
                    if (torneoSeleccionado) {
                      setFechaInicio(torneoSeleccionado.fecha_inicio)
                    }
                  }

                  if (errors.torneo_id_auto) {
                    const { torneo_id_auto, ...rest } = errors
                    setErrors(rest)
                  }
                }}
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                  errors.torneo_id_auto ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <option value="">Seleccionar torneo</option>
                {torneos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
              {errors.torneo_id_auto && <p className="text-red-400 text-xs mt-1">{errors.torneo_id_auto}</p>}

              {/* Mostrar fechas del torneo seleccionado */}
              {torneoIdAuto && (() => {
                const torneoSeleccionado = torneos.find(t => t.id === torneoIdAuto)
                if (torneoSeleccionado) {
                  return (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      <span>
                        Torneo: {new Date(torneoSeleccionado.fecha_inicio).toLocaleDateString('es-AR')} - {new Date(torneoSeleccionado.fecha_fin).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            {/* Fecha inicio + Intervalo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Fecha de Inicio *
                </label>
                <DatePicker
                  value={fechaInicio}
                  onChange={(val) => {
                    setFechaInicio(val)
                    if (errors.fecha_inicio) {
                    const { fecha_inicio, ...rest } = errors
                    setErrors(rest)
                  }
                  }}
                  placeholder="Seleccionar fecha"
                  hasError={!!errors.fecha_inicio}
                />
                {errors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{errors.fecha_inicio}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Intervalo entre Jornadas (días) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={intervaloDias}
                  onChange={(e) => {
                    setIntervaloDias(Number(e.target.value))
                    if (errors.intervalo_dias) {
                      const { intervalo_dias, ...rest } = errors
                      setErrors(rest)
                    }
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.intervalo_dias ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.intervalo_dias && <p className="text-red-400 text-xs mt-1">{errors.intervalo_dias}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ej: 7 = partidos cada semana
                </p>
              </div>
            </div>

            {/* Hora inicio + Diferencia horaria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Hora del Primer Partido *
                </label>
                <input
                  type="text"
                  value={horaInicio}
                  onChange={(e) => {
                    setHoraInicio(e.target.value)
                    if (errors.hora_inicio) {
                      const { hora_inicio, ...rest } = errors
                      setErrors(rest)
                    }
                  }}
                  placeholder="15:00"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    errors.hora_inicio ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.hora_inicio && <p className="text-red-400 text-xs mt-1">{errors.hora_inicio}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Diferencia entre Partidos (minutos) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={diferenciaHoraria}
                  onChange={(e) => {
                    setDiferenciaHoraria(Number(e.target.value))
                    if (errors.diferencia_horaria) {
                      const { diferencia_horaria, ...rest } = errors
                      setErrors(rest)
                    }
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.diferencia_horaria ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.diferencia_horaria && <p className="text-red-400 text-xs mt-1">{errors.diferencia_horaria}</p>}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ej: 120 = 2 horas entre partidos
                </p>
              </div>
            </div>

            {/* Ida y vuelta */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={idaVuelta}
                  onChange={(e) => setIdaVuelta(e.target.checked)}
                  className="w-4 h-4 text-primary bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Generar partidos de ida y vuelta (duplica los partidos invirtiendo local/visitante)
                </span>
              </label>
            </div>

            {/* Ubicación + Cancha (opcionales) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Ubicación por Defecto
                </label>
                <input
                  type="text"
                  value={ubicacionAuto}
                  onChange={(e) => setUbicacionAuto(e.target.value)}
                  placeholder="Estadio Principal"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Cancha por Defecto
                </label>
                <input
                  type="text"
                  value={canchaAuto}
                  onChange={(e) => setCanchaAuto(e.target.value)}
                  placeholder="Cancha 1"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard/club/calendario')}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Generar Partidos
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Preview de resultados */}
          {previewData && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
                <div>
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                    ¡Partidos creados exitosamente!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Se generaron <strong>{previewData.partidos_creados}</strong> partidos en total
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Detalle por categoría:</p>
                {previewData.por_categoria.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-500/20"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{cat.categoria_nombre}</p>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        <strong>{cat.equipos}</strong> equipos
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{cat.partidos}</strong> partidos
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/dashboard/club/calendario')}
                className="mt-4 w-full px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver en Calendario
              </button>
            </div>
          )}
        </>
      )}

      {/* Notification */}
      <NotificationModal
        isOpen={notification.open}
        onClose={handleNotificationClose}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
