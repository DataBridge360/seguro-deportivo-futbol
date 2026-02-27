'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTorneo, getCategorias } from '@/lib/api'
import type { CreateTorneoDTO, Categoria } from '@/types/club'
import DatePicker from '@/components/ui/DatePicker'
import NotificationModal from '@/components/ui/NotificationModal'

interface Props {
  basePath: string
}

export default function NuevoTorneoForm({ basePath }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success'
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

  const handleChange = (field: keyof CreateTorneoDTO, value: string | number | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const toggleCategoria = (catId: string) => {
    setForm(prev => {
      const ids = prev.categoria_ids || []
      return { ...prev, categoria_ids: ids.includes(catId) ? ids.filter(id => id !== catId) : [...ids, catId] }
    })
    if (errors.categoria_ids) {
      setErrors(prev => { const next = { ...prev }; delete next.categoria_ids; return next })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    else if (form.nombre.length > 200) newErrors.nombre = 'Máximo 200 caracteres'
    if (form.descripcion && form.descripcion.length > 1000) newErrors.descripcion = 'Máximo 1000 caracteres'
    if (!form.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    if (!form.fecha_fin) newErrors.fecha_fin = 'La fecha de fin es obligatoria'
    if (form.fecha_inicio && form.fecha_fin && new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
      newErrors.fecha_fin = 'Debe ser posterior a la fecha de inicio'
    }
    if (!form.max_jugadores_por_equipo || form.max_jugadores_por_equipo < 1) {
      newErrors.max_jugadores_por_equipo = 'Mínimo 1 jugador'
    }
    if (!form.categoria_ids || form.categoria_ids.length === 0) {
      newErrors.categoria_ids = 'Seleccioná al menos una categoría'
    }
    if (form.inscripcion_inicio && form.inscripcion_fin && new Date(form.inscripcion_fin) < new Date(form.inscripcion_inicio)) {
      newErrors.inscripcion_fin = 'Debe ser igual o posterior a la apertura'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      setLoading(true)
      const data: CreateTorneoDTO = {
        nombre: form.nombre.trim(),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        max_jugadores_por_equipo: form.max_jugadores_por_equipo,
      }
      if (form.descripcion?.trim()) data.descripcion = form.descripcion.trim()
      if (form.inscripcion_inicio) data.inscripcion_inicio = form.inscripcion_inicio
      if (form.inscripcion_fin) data.inscripcion_fin = form.inscripcion_fin
      if (form.categoria_ids && form.categoria_ids.length > 0) data.categoria_ids = form.categoria_ids

      await createTorneo(data)
      setCreated(true)
      setNotification({ open: true, title: 'Torneo creado', message: `"${form.nombre}" fue creado exitosamente`, type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al crear torneo', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Torneo</h1>
      </div>

      {created ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-green-500 text-2xl">check</span>
          </div>
          <p className="text-slate-900 dark:text-white font-medium">Torneo creado</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">&quot;{form.nombre}&quot; fue creado exitosamente</p>
          <button
            onClick={() => router.push(basePath)}
            className="mt-4 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Volver a torneos
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Apertura 2026"
              maxLength={200}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                errors.nombre ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Descripción <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              placeholder="Descripción del torneo"
              maxLength={1000}
              rows={3}
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary resize-none ${
                errors.descripcion ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{form.descripcion?.length || 0}/1000</p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                Inicio <span className="text-red-500">*</span>
              </label>
              <DatePicker value={form.fecha_inicio} onChange={(val) => handleChange('fecha_inicio', val)} placeholder="Fecha inicio" hasError={!!errors.fecha_inicio} />
              {errors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{errors.fecha_inicio}</p>}
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                Fin <span className="text-red-500">*</span>
              </label>
              <DatePicker value={form.fecha_fin} onChange={(val) => handleChange('fecha_fin', val)} placeholder="Fecha fin" hasError={!!errors.fecha_fin} />
              {errors.fecha_fin && <p className="text-red-400 text-xs mt-1">{errors.fecha_fin}</p>}
            </div>
          </div>

          {/* Máx jugadores */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Máx. jugadores por equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.max_jugadores_por_equipo || ''}
              onChange={(e) => handleChange('max_jugadores_por_equipo', e.target.value ? parseInt(e.target.value) : 0)}
              placeholder="Ej: 22"
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                errors.max_jugadores_por_equipo ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.max_jugadores_por_equipo && <p className="text-red-400 text-xs mt-1">{errors.max_jugadores_por_equipo}</p>}
          </div>

          {/* Período de inscripción */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Período de inscripción <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DatePicker value={form.inscripcion_inicio || ''} onChange={(val) => handleChange('inscripcion_inicio', val)} placeholder="Apertura" hasError={!!errors.inscripcion_inicio} />
                {errors.inscripcion_inicio && <p className="text-red-400 text-xs mt-1">{errors.inscripcion_inicio}</p>}
              </div>
              <div>
                <DatePicker value={form.inscripcion_fin || ''} onChange={(val) => handleChange('inscripcion_fin', val)} placeholder="Cierre" hasError={!!errors.inscripcion_fin} />
                {errors.inscripcion_fin && <p className="text-red-400 text-xs mt-1">{errors.inscripcion_fin}</p>}
              </div>
            </div>
          </div>

          {/* Categorías — pills */}
          {categorias.length > 0 && (
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                Categorías <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((cat) => {
                  const selected = form.categoria_ids?.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoria(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  )
                })}
              </div>
              {errors.categoria_ids && <p className="text-red-400 text-xs mt-1">{errors.categoria_ids}</p>}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : 'Crear Torneo'}
            </button>
          </div>
        </form>
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
