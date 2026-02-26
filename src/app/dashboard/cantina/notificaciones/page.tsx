'use client'

import { useState, useEffect } from 'react'
import {
  createNotificacion,
  getNotificacionesEnviadas,
  CreateNotificacionData,
  NotificacionEnviadaResponse,
} from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `Hace ${diffD}d`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function CantinaNotificacionesPage() {
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [incluirCupon, setIncluirCupon] = useState(false)
  const [tipoCupon, setTipoCupon] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [valorCupon, setValorCupon] = useState('')
  const [tituloCupon, setTituloCupon] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notifMessage, setNotifMessage] = useState('')

  const [historial, setHistorial] = useState<NotificacionEnviadaResponse[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)

  useEffect(() => {
    getNotificacionesEnviadas()
      .then(setHistorial)
      .catch(() => {})
      .finally(() => setLoadingHistorial(false))
  }, [])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!asunto.trim()) newErrors.asunto = 'El asunto es obligatorio'
    if (!mensaje.trim()) newErrors.mensaje = 'El mensaje es obligatorio'
    if (incluirCupon) {
      if (!tituloCupon.trim()) newErrors.tituloCupon = 'El titulo del cupon es obligatorio'
      if (!valorCupon || parseFloat(valorCupon) <= 0) newErrors.valorCupon = 'El valor del cupon es obligatorio'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setSending(true)
      const data: CreateNotificacionData = {
        titulo: asunto.trim(),
        mensaje: mensaje.trim(),
        tipo_filtro: 'todos',
        con_cupon: incluirCupon,
      }
      if (incluirCupon) {
        data.cupon = {
          titulo: tituloCupon.trim(),
          tipo_descuento: tipoCupon,
          valor_descuento: parseFloat(valorCupon),
        }
      }
      const result = await createNotificacion(data)
      setNotifMessage(
        incluirCupon
          ? `Notificacion enviada a ${result.destinatarios_count} jugadores con cupon de ${tipoCupon === 'porcentaje' ? `${valorCupon}%` : `$${valorCupon}`}.`
          : `Notificacion enviada a ${result.destinatarios_count} jugadores.`
      )
      setShowNotification(true)
    } catch (error) {
      setNotifMessage(error instanceof Error ? error.message : 'Error al enviar')
      setShowNotification(true)
    } finally {
      setSending(false)
    }
  }

  const handleNotificationClose = () => {
    setShowNotification(false)
    setAsunto('')
    setMensaje('')
    setIncluirCupon(false)
    setValorCupon('')
    setTituloCupon('')
    getNotificacionesEnviadas().then(setHistorial).catch(() => {})
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Envia mensajes a todos los jugadores del club</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Asunto</label>
          <input
            type="text"
            value={asunto}
            onChange={(e) => { setAsunto(e.target.value); clearError('asunto') }}
            placeholder="Ej: Promocion del dia"
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${errors.asunto ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.asunto && <p className="text-red-400 text-xs mt-1">{errors.asunto}</p>}
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Mensaje</label>
          <textarea
            value={mensaje}
            onChange={(e) => { setMensaje(e.target.value); clearError('mensaje') }}
            placeholder="Escribi el mensaje..."
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-h-[120px] resize-none ${errors.mensaje ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          {errors.mensaje && <p className="text-red-400 text-xs mt-1">{errors.mensaje}</p>}
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={incluirCupon} onChange={(e) => setIncluirCupon(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">Incluir cupon de descuento</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Se generara un cupon para cada jugador</p>
            </div>
          </label>

          {incluirCupon && (
            <div className="mt-4 space-y-3 pl-7">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Titulo del cupon</label>
                <input type="text" value={tituloCupon} onChange={(e) => { setTituloCupon(e.target.value); clearError('tituloCupon') }}
                  placeholder="Ej: Descuento en cantina"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.tituloCupon ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.tituloCupon && <p className="text-red-400 text-xs mt-1">{errors.tituloCupon}</p>}
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Tipo de descuento</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setTipoCupon('porcentaje')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${tipoCupon === 'porcentaje' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`}
                  >Porcentaje (%)</button>
                  <button type="button" onClick={() => setTipoCupon('monto_fijo')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${tipoCupon === 'monto_fijo' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`}
                  >Monto fijo ($)</button>
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">
                  Valor {tipoCupon === 'porcentaje' ? '(%)' : '($)'}
                </label>
                <input type="number" value={valorCupon} onChange={(e) => { setValorCupon(e.target.value); clearError('valorCupon') }}
                  placeholder={tipoCupon === 'porcentaje' ? 'Ej: 15' : 'Ej: 500'} min="1"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.valorCupon ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.valorCupon && <p className="text-red-400 text-xs mt-1">{errors.valorCupon}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={sending}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">send</span> Enviar notificacion</>
            )}
          </button>
        </div>
      </form>

      {/* Historial */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Historial</h2>
        {loadingHistorial ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No hay notificaciones enviadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historial.map(notif => (
              <div key={notif.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">{notif.con_cupon ? 'sell' : 'notifications'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{notif.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {notif.con_cupon && (
                      <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs rounded-full border border-amber-500/20">Con cupon</span>
                    )}
                    <span className="text-slate-400 dark:text-slate-500 text-xs">{timeAgo(notif.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NotificationModal isOpen={showNotification} onClose={handleNotificationClose} title="Notificacion enviada" message={notifMessage} type="success" />
    </div>
  )
}
