'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTorneo } from '@/lib/api'
import type { CreateTorneoDTO } from '@/types/club'
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

  const [form, setForm] = useState<CreateTorneoDTO>({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'proximo',
    inscripciones_abiertas: false,
    max_jugadores_por_equipo: undefined,
  })

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

    if (form.max_jugadores_por_equipo !== undefined && form.max_jugadores_por_equipo < 1) {
      newErrors.max_jugadores_por_equipo = 'Debe ser al menos 1 jugador'
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
      }

      if (form.descripcion?.trim()) {
        data.descripcion = form.descripcion.trim()
      }

      if (form.estado) {
        data.estado = form.estado
      }

      if (form.inscripciones_abiertas !== undefined) {
        data.inscripciones_abiertas = form.inscripciones_abiertas
      }

      if (form.max_jugadores_por_equipo && form.max_jugadores_por_equipo > 0) {
        data.max_jugadores_por_equipo = form.max_jugadores_por_equipo
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

        {/* Estado */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Estado
          </label>
          <select
            value={form.estado}
            onChange={(e) => handleChange('estado', e.target.value as CreateTorneoDTO['estado'])}
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
          >
            <option value="proximo">Próximo</option>
            <option value="en_curso">En curso</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Máximo de jugadores */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Máximo de jugadores por equipo
          </label>
          <input
            type="number"
            min="1"
            value={form.max_jugadores_por_equipo || ''}
            onChange={(e) => handleChange('max_jugadores_por_equipo', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ej: 22"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.max_jugadores_por_equipo ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.max_jugadores_por_equipo && <p className="text-red-400 text-xs mt-1">{errors.max_jugadores_por_equipo}</p>}
        </div>

        {/* Inscripciones abiertas */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="inscripciones"
            checked={form.inscripciones_abiertas}
            onChange={(e) => handleChange('inscripciones_abiertas', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary focus:ring-primary/50"
          />
          <label htmlFor="inscripciones" className="text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            Inscripciones abiertas
          </label>
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
