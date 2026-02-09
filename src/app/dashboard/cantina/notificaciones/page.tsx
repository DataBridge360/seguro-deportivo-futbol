'use client'

import { useState } from 'react'
import NotificationModal from '@/components/ui/NotificationModal'

export default function CantinaNotificacionesPage() {
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [incluirCupon, setIncluirCupon] = useState(false)
  const [tipoCupon, setTipoCupon] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [valorCupon, setValorCupon] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNotification, setShowNotification] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!asunto.trim()) newErrors.asunto = 'El asunto es obligatorio'
    if (!mensaje.trim()) newErrors.mensaje = 'El mensaje es obligatorio'
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
    setAsunto('')
    setMensaje('')
    setIncluirCupon(false)
    setValorCupon('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Envia mensajes a los jugadores con opcion de incluir un cupon
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Asunto</label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => { setAsunto(e.target.value); if (errors.asunto) setErrors(prev => ({ ...prev, asunto: '' })) }}
            placeholder="Ej: Promocion especial del dia"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.asunto ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.asunto && <p className="text-red-400 text-xs mt-1">{errors.asunto}</p>}
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Mensaje</label>
          <textarea
            value={mensaje}
            onChange={(e) => { setMensaje(e.target.value); if (errors.mensaje) setErrors(prev => ({ ...prev, mensaje: '' })) }}
            placeholder="Escribi el mensaje..."
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-h-[120px] resize-none ${errors.mensaje ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.mensaje && <p className="text-red-400 text-xs mt-1">{errors.mensaje}</p>}
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
                  onChange={(e) => { setValorCupon(e.target.value); if (errors.valorCupon) setErrors(prev => ({ ...prev, valorCupon: '' })) }}
                  placeholder={tipoCupon === 'porcentaje' ? 'Ej: 15' : 'Ej: 500'}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.valorCupon ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  min="1"
                />
                {errors.valorCupon && <p className="text-red-400 text-xs mt-1">{errors.valorCupon}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Enviar notificacion
          </button>
        </div>
      </form>

      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title="Notificacion enviada"
        message={incluirCupon
          ? `La notificacion fue enviada con un cupon de ${tipoCupon === 'porcentaje' ? `${valorCupon}%` : `$${valorCupon}`} de descuento.`
          : 'La notificacion fue enviada correctamente.'
        }
        type="success"
      />
    </div>
  )
}
