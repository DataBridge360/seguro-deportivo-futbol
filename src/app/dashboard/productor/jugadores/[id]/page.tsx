'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { MOCK_CLUBS, MOCK_JUGADORES } from '@/lib/mockData'
import type { Club } from '@/lib/mockData'

export default function EditarJugadorPage() {
  const router = useRouter()
  const params = useParams()
  const jugadorId = params.id as string

  const [form, setForm] = useState({
    nombreCompleto: '',
    dni: '',
    fechaNacimiento: '',
    clubId: '',
    seguroInicio: '',
    seguroFin: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' })

  useEffect(() => {
    const jugador = MOCK_JUGADORES.find(j => j.id === jugadorId)
    if (jugador) {
      setForm({
        nombreCompleto: jugador.nombreCompleto,
        dni: jugador.dni,
        fechaNacimiento: jugador.fechaNacimiento,
        clubId: jugador.clubId,
        seguroInicio: jugador.seguroInicio,
        seguroFin: jugador.seguroFin,
      })
    } else {
      setNotFound(true)
    }
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

    if (!form.nombreCompleto.trim()) newErrors.nombreCompleto = 'El nombre es obligatorio'
    if (!form.dni.trim()) newErrors.dni = 'El DNI es obligatorio'
    else if (!/^\d+$/.test(form.dni.trim())) newErrors.dni = 'El DNI debe ser numerico'
    if (!form.fechaNacimiento) newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria'
    if (!form.clubId) newErrors.clubId = 'Debe seleccionar un club'
    if (!form.seguroInicio) newErrors.seguroInicio = 'La fecha de inicio es obligatoria'
    if (!form.seguroFin) newErrors.seguroFin = 'La fecha de finalizacion es obligatoria'
    else if (form.seguroInicio && form.seguroFin && new Date(form.seguroFin) <= new Date(form.seguroInicio)) {
      newErrors.seguroFin = 'La fecha de fin debe ser posterior a la de inicio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)

    setNotification({
      open: true,
      title: 'Cambios guardados',
      message: `Los datos de ${form.nombreCompleto} se actualizaron correctamente.`,
    })
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Editar Jugador</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Modifica los datos del jugador asegurado</p>
      </div>

      {/* Formulario */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={form.nombreCompleto}
            onChange={(e) => handleChange('nombreCompleto', e.target.value)}
            placeholder="Ej: Juan Perez"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.nombreCompleto ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.nombreCompleto && <p className="text-red-400 text-xs mt-1">{errors.nombreCompleto}</p>}
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

        {/* Club */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Club</label>
          <select
            value={form.clubId}
            onChange={(e) => handleChange('clubId', e.target.value)}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${errors.clubId ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          >
            <option value="">Seleccionar club</option>
            {MOCK_CLUBS.map(club => (
              <option key={club.id} value={club.id}>{club.nombre}</option>
            ))}
          </select>
          {errors.clubId && <p className="text-red-400 text-xs mt-1">{errors.clubId}</p>}
        </div>

        {/* Fechas del seguro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Inicio del seguro</label>
            <DatePicker
              value={form.seguroInicio}
              onChange={(val) => handleChange('seguroInicio', val)}
              placeholder="Seleccionar fecha"
              hasError={!!errors.seguroInicio}
            />
            {errors.seguroInicio && <p className="text-red-400 text-xs mt-1">{errors.seguroInicio}</p>}
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Finalizacion del seguro</label>
            <DatePicker
              value={form.seguroFin}
              onChange={(val) => handleChange('seguroFin', val)}
              placeholder="Seleccionar fecha"
              hasError={!!errors.seguroFin}
            />
            {errors.seguroFin && <p className="text-red-400 text-xs mt-1">{errors.seguroFin}</p>}
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
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Notificacion */}
      <NotificationModal
        isOpen={notification.open}
        onClose={() => {
          setNotification(prev => ({ ...prev, open: false }))
          router.push('/dashboard/productor/jugadores')
        }}
        title={notification.title}
        message={notification.message}
        type="success"
      />
    </div>
  )
}
