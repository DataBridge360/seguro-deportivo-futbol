'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEquipo } from '@/lib/api'
import type { CreateEquipoDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function NuevoEquipoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  })

  const [form, setForm] = useState<CreateEquipoDTO>({
    nombre: '',
    logo_url: '',
    color_primario: '',
    color_secundario: '',
    activo: true,
    categoria_ids: [],
  })

  const handleChange = (field: keyof CreateEquipoDTO, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateColorHex = (color: string): boolean => {
    if (!color) return true // Color es opcional
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    return hexRegex.test(color)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (form.nombre.length > 200) {
      newErrors.nombre = 'El nombre no puede exceder 200 caracteres'
    }

    if (form.logo_url && form.logo_url.length > 1000) {
      newErrors.logo_url = 'La URL no puede exceder 1000 caracteres'
    }

    if (form.logo_url && !form.logo_url.startsWith('http')) {
      newErrors.logo_url = 'Debe ser una URL válida (http:// o https://)'
    }

    if (form.color_primario && !validateColorHex(form.color_primario)) {
      newErrors.color_primario = 'Debe ser un color hexadecimal válido (Ej: #FF5733)'
    }

    if (form.color_secundario && !validateColorHex(form.color_secundario)) {
      newErrors.color_secundario = 'Debe ser un color hexadecimal válido (Ej: #FFFFFF)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setLoading(true)

      // Preparar datos para enviar (sin campos opcionales vacíos)
      const data: CreateEquipoDTO = {
        nombre: form.nombre.trim(),
      }

      if (form.logo_url?.trim()) {
        data.logo_url = form.logo_url.trim()
      }

      if (form.color_primario?.trim()) {
        data.color_primario = form.color_primario.trim().toUpperCase()
      }

      if (form.color_secundario?.trim()) {
        data.color_secundario = form.color_secundario.trim().toUpperCase()
      }

      if (form.activo !== undefined) {
        data.activo = form.activo
      }

      if (form.categoria_ids && form.categoria_ids.length > 0) {
        data.categoria_ids = form.categoria_ids
      }

      await createEquipo(data)

      setNotification({
        open: true,
        title: 'Equipo creado',
        message: `El equipo "${form.nombre}" fue creado exitosamente`,
        type: 'success'
      })

      // Redireccionar después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/club/equipos')
      }, 2000)

    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al crear equipo',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Equipo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Creá un nuevo equipo para tu club
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Nombre del equipo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Los Halcones"
            maxLength={200}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            URL del logo
          </label>
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => handleChange('logo_url', e.target.value)}
            placeholder="https://ejemplo.com/logo.png"
            maxLength={1000}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.logo_url ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.logo_url && <p className="text-red-400 text-xs mt-1">{errors.logo_url}</p>}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">URL de la imagen del logo del equipo (opcional)</p>
        </div>

        {/* Colores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Color primario
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.color_primario || '#0000FF'}
                onChange={(e) => handleChange('color_primario', e.target.value)}
                className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={form.color_primario}
                onChange={(e) => handleChange('color_primario', e.target.value)}
                placeholder="#0000FF"
                maxLength={7}
                className={`flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary font-mono uppercase ${
                  errors.color_primario ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
            </div>
            {errors.color_primario && <p className="text-red-400 text-xs mt-1">{errors.color_primario}</p>}
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Color secundario
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={form.color_secundario || '#FFFFFF'}
                onChange={(e) => handleChange('color_secundario', e.target.value)}
                className="w-12 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={form.color_secundario}
                onChange={(e) => handleChange('color_secundario', e.target.value)}
                placeholder="#FFFFFF"
                maxLength={7}
                className={`flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary font-mono uppercase ${
                  errors.color_secundario ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
            </div>
            {errors.color_secundario && <p className="text-red-400 text-xs mt-1">{errors.color_secundario}</p>}
          </div>
        </div>

        {/* Activo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="activo"
            checked={form.activo}
            onChange={(e) => handleChange('activo', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary focus:ring-primary/50"
          />
          <label htmlFor="activo" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            Equipo activo
          </label>
        </div>

        {/* Info sobre categorías */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-blue-500 text-lg">info</span>
            <div className="flex-1">
              <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">Categorías</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Actualmente no se pueden asignar categorías al crear un equipo. Esta funcionalidad estará disponible próximamente.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">add</span>
                Crear Equipo
              </>
            )}
          </button>
        </div>
      </form>

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
