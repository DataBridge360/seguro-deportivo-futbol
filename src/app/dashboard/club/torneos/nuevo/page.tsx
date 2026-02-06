'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/ui/DatePicker'
import NotificationModal from '@/components/ui/NotificationModal'
import { EQUIPOS_NOMBRES } from '@/lib/mockData'

const equiposDisponibles = [...EQUIPOS_NOMBRES]

interface FormErrors {
  nombre?: string
  fechaInicio?: string
  fechaFin?: string
  equipos?: string
}

export default function NuevoTorneoPage() {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [showNotification, setShowNotification] = useState(false)

  const toggleEquipo = (equipo: string) => {
    setEquiposSeleccionados((prev) =>
      prev.includes(equipo)
        ? prev.filter((e) => e !== equipo)
        : [...prev, equipo]
    )
    if (errors.equipos) setErrors((prev) => ({ ...prev, equipos: undefined }))
  }

  const validate = () => {
    const newErrors: FormErrors = {}

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del torneo es obligatorio'
    }

    if (!fechaInicio) {
      newErrors.fechaInicio = 'La fecha de inicio es obligatoria'
    }

    if (!fechaFin) {
      newErrors.fechaFin = 'La fecha de finalización es obligatoria'
    }

    if (fechaInicio && fechaFin && fechaFin <= fechaInicio) {
      newErrors.fechaFin = 'La fecha de finalización debe ser posterior a la de inicio'
    }

    if (equiposSeleccionados.length === 0) {
      newErrors.equipos = 'Seleccioná al menos un equipo participante'
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
    router.push('/dashboard/club/torneos')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nuevo Torneo
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Registrá un nuevo torneo para tu club
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
      >
        {/* Nombre del torneo */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Nombre del torneo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }))
            }}
            placeholder="Ej: Torneo Apertura 2025"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.nombre
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.nombre && (
            <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha de inicio */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Fecha de inicio
            </label>
            <DatePicker
              value={fechaInicio}
              onChange={(value) => {
                setFechaInicio(value)
                if (errors.fechaInicio) setErrors((prev) => ({ ...prev, fechaInicio: undefined }))
              }}
              placeholder="dd/mm/aaaa"
              hasError={!!errors.fechaInicio}
            />
            {errors.fechaInicio && (
              <p className="text-red-400 text-xs mt-1">{errors.fechaInicio}</p>
            )}
          </div>

          {/* Fecha de finalización */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Fecha de finalización
            </label>
            <DatePicker
              value={fechaFin}
              onChange={(value) => {
                setFechaFin(value)
                if (errors.fechaFin) setErrors((prev) => ({ ...prev, fechaFin: undefined }))
              }}
              placeholder="dd/mm/aaaa"
              hasError={!!errors.fechaFin}
            />
            {errors.fechaFin && (
              <p className="text-red-400 text-xs mt-1">{errors.fechaFin}</p>
            )}
          </div>
        </div>

        {/* Equipos participantes */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Equipos participantes
          </label>
          <div className="flex flex-wrap gap-3">
            {equiposDisponibles.map((equipo) => {
              const selected = equiposSeleccionados.includes(equipo)
              return (
                <button
                  key={equipo}
                  type="button"
                  onClick={() => toggleEquipo(equipo)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary dark:text-primary'
                      : errors.equipos
                        ? 'border-red-500 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                        selected
                          ? 'bg-primary border-primary text-white'
                          : errors.equipos
                            ? 'border-red-500'
                            : 'border-slate-400 dark:border-slate-500'
                      }`}
                    >
                      {selected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {equipo}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.equipos && (
            <p className="text-red-400 text-xs mt-1">{errors.equipos}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/club/torneos')}
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
        title="Torneo creado"
        message="El torneo se registró correctamente."
        type="success"
      />
    </div>
  )
}
