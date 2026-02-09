'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { MOCK_CLUBS } from '@/lib/mockData'

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function calcFinDate(inicio: string, duracion: string): string {
  if (!inicio) return ''
  const d = new Date(inicio + 'T00:00:00')
  switch (duracion) {
    case 'mensual': d.setMonth(d.getMonth() + 1); break
    case 'trimestral': d.setMonth(d.getMonth() + 3); break
    case 'semestral': d.setMonth(d.getMonth() + 6); break
    case 'anual': d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0]
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function NuevoJugadorPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    nombreCompleto: '',
    dni: '',
    fechaNacimiento: '',
    telefono: '',
    direccion: '',
    clubId: '',
    seguroInicio: getTodayStr(),
    duracion: 'anual' as 'mensual' | 'trimestral' | 'semestral' | 'anual',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' })

  const seguroFin = calcFinDate(form.seguroInicio, form.duracion)

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
    if (!form.telefono.trim()) newErrors.telefono = 'El telefono es obligatorio'
    if (!form.direccion.trim()) newErrors.direccion = 'La direccion es obligatoria'
    if (!form.clubId) newErrors.clubId = 'Debe seleccionar un club'
    if (!form.seguroInicio) newErrors.seguroInicio = 'La fecha de inicio es obligatoria'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)

    const clubName = MOCK_CLUBS.find(c => c.id === form.clubId)?.nombre || ''
    setNotification({
      open: true,
      title: 'Jugador registrado',
      message: `${form.nombreCompleto} fue dado de alta en ${clubName} correctamente.`,
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Jugador</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Completa los datos para dar de alta un nuevo jugador asegurado</p>
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

        {/* Telefono y Direccion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Telefono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              placeholder="Ej: 1155001234"
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.telefono ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
            />
            {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Direccion</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => handleChange('direccion', e.target.value)}
              placeholder="Ej: Av. Siempreviva 742"
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.direccion ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
            />
            {errors.direccion && <p className="text-red-400 text-xs mt-1">{errors.direccion}</p>}
          </div>
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

        {/* Fecha inicio seguro */}
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

        {/* Duracion del seguro */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-2">Duracion del seguro</label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'mensual', label: 'Mensual', desc: '1 mes' },
              { value: 'trimestral', label: 'Trimestral', desc: '3 meses' },
              { value: 'semestral', label: 'Semestral', desc: '6 meses' },
              { value: 'anual', label: 'Anual', desc: '12 meses' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, duracion: opt.value }))}
                className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                  form.duracion === opt.value
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  form.duracion === opt.value ? 'border-green-500' : 'border-slate-400 dark:border-slate-500'
                }`}>
                  {form.duracion === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${form.duracion === opt.value ? 'text-green-400' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de vigencia */}
        {form.seguroInicio && (
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1.5">
              <span>Inicio:</span>
              <span className="text-slate-900 dark:text-white font-medium">{formatDateShort(form.seguroInicio)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Finalizacion:</span>
              <span className="text-green-400 font-medium">{formatDateShort(seguroFin)}</span>
            </div>
          </div>
        )}
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
          {loading ? 'Guardando...' : 'Guardar Jugador'}
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
