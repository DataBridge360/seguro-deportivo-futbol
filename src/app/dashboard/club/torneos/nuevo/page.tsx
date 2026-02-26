'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTorneo, getCategorias } from '@/lib/api'
import type { CreateTorneoDTO, Categoria } from '@/types/club'
import DatePicker from '@/components/ui/DatePicker'
import NotificationModal from '@/components/ui/NotificationModal'

export default function NuevoTorneoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  })

  const [categorias, setCategorias] = useState<Categoria[]>([])

  const [form, setForm] = useState<CreateTorneoDTO>({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    inscripcion_inicio: '',
    inscripcion_fin: '',
    max_jugadores_por_equipo: 0,
    categoria_ids: [],
  })

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const handleChange = (field: keyof CreateTorneoDTO, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const toggleCategoria = (catId: string) => {
    setForm(prev => {
      const ids = prev.categoria_ids || []
      return {
        ...prev,
        categoria_ids: ids.includes(catId)
          ? ids.filter(id => id !== catId)
          : [...ids, catId],
      }
    })
    // Limpiar error de categorías si existe
    if (errors.categoria_ids) {
      setErrors(prev => {
        const next = { ...prev }
        delete next.categoria_ids
        return next
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (form.nombre.length > 200) {
      newErrors.nombre = 'El nombre no puede exceder 200 caracteres'
    }

    if (form.descripcion && form.descripcion.length > 1000) {
      newErrors.descripcion = 'La descripción no puede exceder 1000 caracteres'
    }

    if (!form.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    }

    if (!form.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria'
    }

    if (form.fecha_inicio && form.fecha_fin) {
      const inicio = new Date(form.fecha_inicio)
      const fin = new Date(form.fecha_fin)
      if (fin <= inicio) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio'
      }
    }

    if (!form.max_jugadores_por_equipo || form.max_jugadores_por_equipo < 1) {
      newErrors.max_jugadores_por_equipo = 'El máximo de jugadores es obligatorio (mínimo 1)'
    }

    if (!form.categoria_ids || form.categoria_ids.length === 0) {
      newErrors.categoria_ids = 'Debe seleccionar al menos una categoría'
    }

    if (form.inscripcion_inicio && form.inscripcion_fin) {
      const inscInicio = new Date(form.inscripcion_inicio)
      const inscFin = new Date(form.inscripcion_fin)
      if (inscFin < inscInicio) {
        newErrors.inscripcion_fin = 'La fecha de cierre debe ser igual o posterior a la de apertura'
      }
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
      const data: CreateTorneoDTO = {
        nombre: form.nombre.trim(),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        max_jugadores_por_equipo: form.max_jugadores_por_equipo,
      }

      if (form.descripcion?.trim()) {
        data.descripcion = form.descripcion.trim()
      }

      if (form.inscripcion_inicio) {
        data.inscripcion_inicio = form.inscripcion_inicio
      }

      if (form.inscripcion_fin) {
        data.inscripcion_fin = form.inscripcion_fin
      }

      if (form.categoria_ids && form.categoria_ids.length > 0) {
        data.categoria_ids = form.categoria_ids
      }

      await createTorneo(data)

      setNotification({
        open: true,
        title: 'Torneo creado',
        message: `El torneo "${form.nombre}" fue creado exitosamente`,
        type: 'success'
      })

      // Redireccionar después de 2 segundos
      setTimeout(() => {
        router.push('/dashboard/club/torneos')
      }, 2000)

    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al crear torneo',
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Torneo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Creá un nuevo torneo para tu club
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Nombre del torneo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Apertura 2026"
            maxLength={200}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            placeholder="Descripción del torneo (opcional)"
            maxLength={1000}
            rows={3}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none ${
              errors.descripcion ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{form.descripcion?.length || 0}/1000</p>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Fecha de inicio <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={form.fecha_inicio}
              onChange={(val) => handleChange('fecha_inicio', val)}
              placeholder="Seleccionar fecha"
              hasError={!!errors.fecha_inicio}
            />
            {errors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{errors.fecha_inicio}</p>}
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Fecha de fin <span className="text-red-500">*</span>
            </label>
            <DatePicker
              value={form.fecha_fin}
              onChange={(val) => handleChange('fecha_fin', val)}
              placeholder="Seleccionar fecha"
              hasError={!!errors.fecha_fin}
            />
            {errors.fecha_fin && <p className="text-red-400 text-xs mt-1">{errors.fecha_fin}</p>}
          </div>
        </div>

        {/* Máximo de jugadores */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Máximo de jugadores por equipo <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={form.max_jugadores_por_equipo || ''}
            onChange={(e) => handleChange('max_jugadores_por_equipo', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="Ej: 22"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.max_jugadores_por_equipo ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.max_jugadores_por_equipo && <p className="text-red-400 text-xs mt-1">{errors.max_jugadores_por_equipo}</p>}
        </div>

        {/* Período de inscripción */}
        <div className="pb-6">
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Período de inscripción
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
            Rango de fechas en el que los jugadores podrán inscribirse al torneo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1">
                Apertura
              </label>
              <DatePicker
                value={form.inscripcion_inicio || ''}
                onChange={(val) => handleChange('inscripcion_inicio', val)}
                placeholder="Fecha de apertura"
                hasError={!!errors.inscripcion_inicio}
              />
              {errors.inscripcion_inicio && <p className="text-red-400 text-xs mt-1">{errors.inscripcion_inicio}</p>}
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs mb-1">
                Cierre
              </label>
              <DatePicker
                value={form.inscripcion_fin || ''}
                onChange={(val) => handleChange('inscripcion_fin', val)}
                placeholder="Fecha de cierre"
                hasError={!!errors.inscripcion_fin}
              />
              {errors.inscripcion_fin && <p className="text-red-400 text-xs mt-1">{errors.inscripcion_fin}</p>}
            </div>
          </div>
        </div>

        {/* Categorías */}
        {categorias.length > 0 && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Categorías del torneo <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              Seleccioná las categorías que participarán en este torneo
            </p>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg border ${
              errors.categoria_ids ? 'border-red-500 bg-red-50/50 dark:bg-red-500/5' : 'border-transparent'
            }`}>
              {categorias.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    form.categoria_ids?.includes(cat.id)
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.categoria_ids?.includes(cat.id) || false}
                    onChange={() => toggleCategoria(cat.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{cat.nombre}</span>
                </label>
              ))}
            </div>
            {errors.categoria_ids && <p className="text-red-400 text-xs mt-1">{errors.categoria_ids}</p>}
          </div>
        )}

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
                Crear Torneo
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
