'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { getJugadorById, updateJugadorProductor } from '@/lib/api'

export default function EditarJugadorPage() {
  const router = useRouter()
  const params = useParams()
  const jugadorId = params.id as string

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({ open: false, title: '', message: '', type: 'success' })

  useEffect(() => {
    getJugadorById(jugadorId)
      .then((jugador) => {
        setForm({
          nombre: jugador.nombre,
          apellido: jugador.apellido,
          dni: jugador.dni,
          fechaNacimiento: jugador.fecha_nacimiento,
        })
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false))
  }, [jugadorId])

  const handleChange = (field: string, value: string) => {
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
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!form.apellido.trim()) newErrors.apellido = 'El apellido es obligatorio'
    if (!form.dni.trim()) newErrors.dni = 'El DNI es obligatorio'
    else if (!/^\d+$/.test(form.dni.trim())) newErrors.dni = 'El DNI debe ser numérico'
    if (!form.fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await updateJugadorProductor(jugadorId, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        fecha_nacimiento: form.fechaNacimiento,
      })
      setNotification({
        open: true,
        title: 'Cambios guardados',
        message: `Los datos de ${form.nombre} ${form.apellido} se actualizaron correctamente.`,
        type: 'success',
      })
    } catch (err: any) {
      setNotification({
        open: true,
        title: 'Error',
        message: err?.message || 'No se pudieron guardar los cambios.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">Jugador no encontrado</p>
        <button
          onClick={() => router.push('/dashboard/productor/jugadores')}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Volver al listado
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Jugador</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Modifica los datos del jugador asegurado</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => handleChange('nombre', e.target.value)}
            placeholder="Ej: Juan"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Apellido</label>
          <input
            type="text"
            value={form.apellido}
            onChange={(e) => handleChange('apellido', e.target.value)}
            placeholder="Ej: Pérez"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.apellido ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido}</p>}
        </div>

        {/* DNI */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">DNI</label>
          <input
            type="text"
            value={form.dni}
            onChange={(e) => handleChange('dni', e.target.value)}
            placeholder="Ej: 40123456"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.dni ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.dni && <p className="text-red-400 text-xs mt-1">{errors.dni}</p>}
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Fecha de nacimiento</label>
          <DatePicker
            value={form.fechaNacimiento}
            onChange={(val) => handleChange('fechaNacimiento', val)}
            placeholder="Seleccionar fecha"
            hasError={!!errors.fechaNacimiento}
          />
          {errors.fechaNacimiento && <p className="text-red-400 text-xs mt-1">{errors.fechaNacimiento}</p>}
        </div>

        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              El estado de pago del seguro se gestiona desde el listado de jugadores con el toggle de pagado.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => router.push('/dashboard/productor/jugadores')}
          className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <NotificationModal
        isOpen={notification.open}
        onClose={() => {
          setNotification(prev => ({ ...prev, open: false }))
          if (notification.type === 'success') router.push('/dashboard/productor/jugadores')
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
