'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/ui/DatePicker'
import NotificationModal from '@/components/ui/NotificationModal'
import { EQUIPOS_NOMBRES, MOCK_TORNEOS } from '@/lib/mockData'

const equipos = [...EQUIPOS_NOMBRES]
const torneos = MOCK_TORNEOS.map(t => t.nombre)

interface FormErrors {
  equipo?: string
  rival?: string
  fecha?: string
  horario?: string
  torneo?: string
  ubicacion?: string
}

export default function NuevoPartidoPage() {
  const router = useRouter()

  const [equipo, setEquipo] = useState('')
  const [rival, setRival] = useState('')
  const [fecha, setFecha] = useState('')
  const [horario, setHorario] = useState('')
  const [torneo, setTorneo] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [showNotification, setShowNotification] = useState(false)

  const validate = () => {
    const newErrors: FormErrors = {}

    if (!equipo) {
      newErrors.equipo = 'Seleccioná un equipo'
    }

    if (!rival.trim()) {
      newErrors.rival = 'El nombre del rival es obligatorio'
    }

    if (!fecha) {
      newErrors.fecha = 'La fecha es obligatoria'
    }

    if (!horario.trim()) {
      newErrors.horario = 'El horario es obligatorio'
    }

    if (!torneo) {
      newErrors.torneo = 'Seleccioná un torneo'
    }

    if (!ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es obligatoria'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setShowNotification(true)
  }

  const handleNotificationClose = () => {
    setShowNotification(false)
    router.push('/dashboard/club/calendario')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nuevo Partido
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Programá un nuevo partido para tu equipo
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
      >
        {/* Equipo + Torneo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Equipo */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Equipo
            </label>
            <select
              value={equipo}
              onChange={(e) => {
                setEquipo(e.target.value)
                if (errors.equipo) setErrors((prev) => ({ ...prev, equipo: undefined }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.equipo
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar equipo</option>
              {equipos.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
            {errors.equipo && (
              <p className="text-red-400 text-xs mt-1">{errors.equipo}</p>
            )}
          </div>

          {/* Torneo */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Torneo
            </label>
            <select
              value={torneo}
              onChange={(e) => {
                setTorneo(e.target.value)
                if (errors.torneo) setErrors((prev) => ({ ...prev, torneo: undefined }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.torneo
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar torneo</option>
              {torneos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.torneo && (
              <p className="text-red-400 text-xs mt-1">{errors.torneo}</p>
            )}
          </div>
        </div>

        {/* Rival */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Rival
          </label>
          <input
            type="text"
            value={rival}
            onChange={(e) => {
              setRival(e.target.value)
              if (errors.rival) setErrors((prev) => ({ ...prev, rival: undefined }))
            }}
            placeholder="Ej: Club Atlético Rivadavia"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.rival
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.rival && (
            <p className="text-red-400 text-xs mt-1">{errors.rival}</p>
          )}
        </div>

        {/* Fecha + Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Fecha
            </label>
            <DatePicker
              value={fecha}
              onChange={(val) => {
                setFecha(val)
                if (errors.fecha) setErrors((prev) => ({ ...prev, fecha: undefined }))
              }}
              placeholder="Seleccionar fecha"
              hasError={!!errors.fecha}
            />
            {errors.fecha && (
              <p className="text-red-400 text-xs mt-1">{errors.fecha}</p>
            )}
          </div>

          {/* Horario */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Horario
            </label>
            <input
              type="text"
              value={horario}
              onChange={(e) => {
                setHorario(e.target.value)
                if (errors.horario) setErrors((prev) => ({ ...prev, horario: undefined }))
              }}
              placeholder="Ej: 15:30"
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                errors.horario
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.horario && (
              <p className="text-red-400 text-xs mt-1">{errors.horario}</p>
            )}
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Ubicación
          </label>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => {
              setUbicacion(e.target.value)
              if (errors.ubicacion) setErrors((prev) => ({ ...prev, ubicacion: undefined }))
            }}
            placeholder="Ej: Estadio Municipal"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.ubicacion
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.ubicacion && (
            <p className="text-red-400 text-xs mt-1">{errors.ubicacion}</p>
          )}
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
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </form>

      {/* Success Notification */}
      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title="Partido creado"
        message="El partido se programó correctamente."
        type="success"
      />
    </div>
  )
}
