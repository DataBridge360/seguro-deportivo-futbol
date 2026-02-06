'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationModal from '@/components/ui/NotificationModal'
import { CATEGORIAS } from '@/lib/mockData'

const categorias = [...CATEGORIAS]

export default function NuevoEquipoPage() {
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const [errors, setErrors] = useState<{ nombre?: string; categoria?: string }>({})
  const [showNotification, setShowNotification] = useState(false)

  const validate = () => {
    const newErrors: { nombre?: string; categoria?: string } = {}

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del equipo es obligatorio'
    }

    if (!categoria) {
      newErrors.categoria = 'Seleccioná una categoría'
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
    router.push('/dashboard/club/equipos')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Nuevo Equipo
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Completá los datos para crear un nuevo equipo
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
      >
        {/* Nombre del equipo */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Nombre del equipo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }))
            }}
            placeholder="Ej: Equipo A"
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

        {/* Categoría */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Categoría
          </label>
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value)
              if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }))
            }}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
              errors.categoria
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.categoria && (
            <p className="text-red-400 text-xs mt-1">{errors.categoria}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/club/equipos')}
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
        title="Equipo creado"
        message="El equipo se creó correctamente."
        type="success"
      />
    </div>
  )
}
