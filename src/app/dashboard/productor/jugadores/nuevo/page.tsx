'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createJugador } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'

const CLUB_ID = '62fe34a2-17a0-41d6-a53d-85997094aabf'
const CLUB_NOMBRE = 'clubplaza'

export default function NuevoJugadorPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  })

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

  // Generate password preview: Apellido (first uppercase) + last 3 DNI digits
  const getPasswordPreview = (): string => {
    if (!form.apellido.trim() || !form.dni.trim() || form.dni.trim().length < 3) return ''
    const apellido = form.apellido.trim()
    const formatted = apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase()
    const lastThree = form.dni.trim().slice(-3)
    return `${formatted}${lastThree}`
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

    try {
      setLoading(true)

      await createJugador({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        dni: form.dni.trim(),
        fecha_nacimiento: form.fechaNacimiento,
        telefono: form.telefono.trim() || undefined,
        direccion: form.direccion.trim() || undefined,
        club_id: CLUB_ID,
      })

      setNotification({
        open: true,
        title: 'Jugador registrado',
        message: `${form.apellido} ${form.nombre} fue dado de alta en ${CLUB_NOMBRE} correctamente.`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al crear jugador',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const passwordPreview = getPasswordPreview()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Jugador</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Completá los datos para dar de alta un nuevo jugador asegurado</p>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Juan"
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
            />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.apellido}
              onChange={(e) => handleChange('apellido', e.target.value)}
              placeholder="Ej: Pérez"
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.apellido ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
            />
            {errors.apellido && <p className="text-red-400 text-xs mt-1">{errors.apellido}</p>}
          </div>
        </div>

        {/* DNI */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            DNI <span className="text-red-500">*</span>
          </label>
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
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Fecha de nacimiento <span className="text-red-500">*</span>
          </label>
          <DatePicker
            value={form.fechaNacimiento}
            onChange={(val) => handleChange('fechaNacimiento', val)}
            placeholder="Seleccionar fecha"
            hasError={!!errors.fechaNacimiento}
          />
          {errors.fechaNacimiento && <p className="text-red-400 text-xs mt-1">{errors.fechaNacimiento}</p>}
        </div>

        {/* Telefono y Direccion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="Ej: 1155001234"
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="Ej: Av. Siempreviva 742"
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Club (hardcoded) */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Club</label>
          <div className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm">
            {CLUB_NOMBRE}
          </div>
        </div>

        {/* Password preview */}
        {passwordPreview && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">key</span>
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Contraseña generada: <span className="font-mono bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">{passwordPreview}</span>
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Formato: Apellido (primera mayúscula) + últimos 3 dígitos del DNI
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info sobre póliza */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              El jugador se creará con el estado de pago pendiente. El productor podrá marcarlo como pagado desde el listado de jugadores.
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
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
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">person_add</span>
              Guardar Jugador
            </>
          )}
        </button>
      </div>

      {/* Notificacion */}
      <NotificationModal
        isOpen={notification.open}
        onClose={() => {
          setNotification(prev => ({ ...prev, open: false }))
          if (notification.type === 'success') {
            router.push('/dashboard/productor/jugadores')
          }
        }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
