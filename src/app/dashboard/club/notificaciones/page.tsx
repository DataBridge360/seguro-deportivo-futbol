'use client'

import { useState } from 'react'
import { EQUIPOS_NOMBRES, MOCK_TORNEOS, CATEGORIAS } from '@/lib/mockData'
import NotificationModal from '@/components/ui/NotificationModal'

const tipoDestinatarioOptions = [
  'Todos los jugadores',
  'Jugadores con seguro vigente',
  'Jugadores sin seguro',
  'Por equipo',
  'Por torneo',
  'Por categoria',
]

const historialNotificaciones = [
  {
    id: 1,
    asunto: 'Recordatorio de entrenamiento',
    destinatarios: 'Todos los jugadores',
    tiempo: 'hace 2 horas',
  },
  {
    id: 2,
    asunto: 'Partido reprogramado',
    destinatarios: 'River Plate',
    tiempo: 'hace 1 dia',
  },
  {
    id: 3,
    asunto: 'Renovacion de seguro',
    destinatarios: 'Jugadores sin seguro',
    tiempo: 'hace 3 dias',
  },
  {
    id: 4,
    asunto: 'Bienvenida nuevos jugadores',
    destinatarios: 'Liga Profesional',
    tiempo: 'hace 1 semana',
  },
]

export default function NotificacionesPage() {
  const [tipoDestinatario, setTipoDestinatario] = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
  const [torneoSeleccionado, setTorneoSeleccionado] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [incluirCupon, setIncluirCupon] = useState(false)
  const [tipoCupon, setTipoCupon] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [valorCupon, setValorCupon] = useState('')
  const [errors, setErrors] = useState<{
    tipoDestinatario?: string
    equipoSeleccionado?: string
    torneoSeleccionado?: string
    categoriaSeleccionada?: string
    asunto?: string
    mensaje?: string
    valorCupon?: string
  }>({})
  const [showNotification, setShowNotification] = useState(false)

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!tipoDestinatario) {
      newErrors.tipoDestinatario = 'Selecciona el tipo de destinatario'
    }

    if (tipoDestinatario === 'Por equipo' && !equipoSeleccionado) {
      newErrors.equipoSeleccionado = 'Selecciona un equipo'
    }

    if (tipoDestinatario === 'Por torneo' && !torneoSeleccionado) {
      newErrors.torneoSeleccionado = 'Selecciona un torneo'
    }

    if (tipoDestinatario === 'Por categoria' && !categoriaSeleccionada) {
      newErrors.categoriaSeleccionada = 'Selecciona una categoria'
    }

    if (!asunto.trim()) {
      newErrors.asunto = 'El asunto es obligatorio'
    }

    if (!mensaje.trim()) {
      newErrors.mensaje = 'El mensaje es obligatorio'
    }

    if (incluirCupon && (!valorCupon || parseFloat(valorCupon) <= 0)) {
      newErrors.valorCupon = 'El valor del cupon es obligatorio'
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
    setTipoDestinatario('')
    setEquipoSeleccionado('')
    setTorneoSeleccionado('')
    setCategoriaSeleccionada('')
    setAsunto('')
    setMensaje('')
    setIncluirCupon(false)
    setValorCupon('')
  }

  const handleTipoDestinatarioChange = (value: string) => {
    setTipoDestinatario(value)
    setEquipoSeleccionado('')
    setTorneoSeleccionado('')
    setCategoriaSeleccionada('')
    if (errors.tipoDestinatario) setErrors((prev) => ({ ...prev, tipoDestinatario: undefined }))
    if (errors.equipoSeleccionado) setErrors((prev) => ({ ...prev, equipoSeleccionado: undefined }))
    if (errors.torneoSeleccionado) setErrors((prev) => ({ ...prev, torneoSeleccionado: undefined }))
    if (errors.categoriaSeleccionada) setErrors((prev) => ({ ...prev, categoriaSeleccionada: undefined }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Notificaciones
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Envia mensajes a los jugadores del club
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5"
      >
        {/* Tipo de destinatario */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Tipo de destinatario
          </label>
          <select
            value={tipoDestinatario}
            onChange={(e) => handleTipoDestinatarioChange(e.target.value)}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
              errors.tipoDestinatario
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            <option value="">Seleccionar tipo de destinatario</option>
            {tipoDestinatarioOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.tipoDestinatario && (
            <p className="text-red-400 text-xs mt-1">{errors.tipoDestinatario}</p>
          )}
        </div>

        {/* Segundo dropdown: Por equipo */}
        {tipoDestinatario === 'Por equipo' && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Equipo
            </label>
            <select
              value={equipoSeleccionado}
              onChange={(e) => {
                setEquipoSeleccionado(e.target.value)
                if (errors.equipoSeleccionado) setErrors((prev) => ({ ...prev, equipoSeleccionado: undefined }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.equipoSeleccionado
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar equipo</option>
              {EQUIPOS_NOMBRES.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            {errors.equipoSeleccionado && (
              <p className="text-red-400 text-xs mt-1">{errors.equipoSeleccionado}</p>
            )}
          </div>
        )}

        {/* Segundo dropdown: Por torneo */}
        {tipoDestinatario === 'Por torneo' && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Torneo
            </label>
            <select
              value={torneoSeleccionado}
              onChange={(e) => {
                setTorneoSeleccionado(e.target.value)
                if (errors.torneoSeleccionado) setErrors((prev) => ({ ...prev, torneoSeleccionado: undefined }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.torneoSeleccionado
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar torneo</option>
              {MOCK_TORNEOS.map((torneo) => (
                <option key={torneo.id} value={torneo.nombre}>
                  {torneo.nombre}
                </option>
              ))}
            </select>
            {errors.torneoSeleccionado && (
              <p className="text-red-400 text-xs mt-1">{errors.torneoSeleccionado}</p>
            )}
          </div>
        )}

        {/* Segundo dropdown: Por categoria */}
        {tipoDestinatario === 'Por categoria' && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Categoria
            </label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value)
                if (errors.categoriaSeleccionada) setErrors((prev) => ({ ...prev, categoriaSeleccionada: undefined }))
              }}
              className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                errors.categoriaSeleccionada
                  ? 'border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              <option value="">Seleccionar categoria</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.categoriaSeleccionada && (
              <p className="text-red-400 text-xs mt-1">{errors.categoriaSeleccionada}</p>
            )}
          </div>
        )}

        {/* Asunto */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Asunto
          </label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => {
              setAsunto(e.target.value)
              if (errors.asunto) setErrors((prev) => ({ ...prev, asunto: undefined }))
            }}
            placeholder="Ej: Recordatorio de entrenamiento"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.asunto
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.asunto && (
            <p className="text-red-400 text-xs mt-1">{errors.asunto}</p>
          )}
        </div>

        {/* Mensaje */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Mensaje
          </label>
          <textarea
            value={mensaje}
            onChange={(e) => {
              setMensaje(e.target.value)
              if (errors.mensaje) setErrors((prev) => ({ ...prev, mensaje: undefined }))
            }}
            placeholder="Escribi el mensaje para los jugadores..."
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-h-[120px] resize-none ${
              errors.mensaje
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.mensaje && (
            <p className="text-red-400 text-xs mt-1">{errors.mensaje}</p>
          )}
        </div>

        {/* Incluir cupon */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirCupon}
              onChange={(e) => setIncluirCupon(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
            />
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">Incluir cupon de descuento</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Se generara un cupon para cada destinatario</p>
            </div>
          </label>

          {incluirCupon && (
            <div className="mt-4 space-y-3 pl-7">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Tipo de descuento</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoCupon('porcentaje')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      tipoCupon === 'porcentaje'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoCupon('monto_fijo')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      tipoCupon === 'monto_fijo'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    Monto fijo ($)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  Valor del descuento {tipoCupon === 'porcentaje' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  value={valorCupon}
                  onChange={(e) => { setValorCupon(e.target.value); if (errors.valorCupon) setErrors((prev) => ({ ...prev, valorCupon: undefined })) }}
                  placeholder={tipoCupon === 'porcentaje' ? 'Ej: 15' : 'Ej: 500'}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.valorCupon ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  min="1"
                />
                {errors.valorCupon && <p className="text-red-400 text-xs mt-1">{errors.valorCupon}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Enviar notificacion
          </button>
        </div>
      </form>

      {/* Historial */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
          Historial de notificaciones
        </h2>
        <div className="space-y-3">
          {historialNotificaciones.map((notif) => (
            <div
              key={notif.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">
                  notifications
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {notif.asunto}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                    {notif.destinatarios}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                    {notif.tiempo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title="Notificacion enviada"
        message={incluirCupon
          ? `La notificacion fue enviada con un cupon de ${tipoCupon === 'porcentaje' ? `${valorCupon}%` : `$${valorCupon}`} de descuento.`
          : 'La notificacion fue enviada correctamente a los destinatarios seleccionados.'
        }
        type="success"
      />
    </div>
  )
}
