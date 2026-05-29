'use client'

import { useState, useEffect } from 'react'
import {
  createNotificacion,
  eliminarCuponNotificacion,
  getNotificacionesEnviadas,
  getEquipos,
  getTorneos,
  getCategorias,
  CreateNotificacionData,
  NotificacionEnviadaResponse,
  CouponColor,
} from '@/lib/api'
import type { Equipo, Torneo, Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'

const tipoDestinatarioOptions: {
  value: string
  label: string
  icon: string
  short: string
}[] = [
  { value: 'todos',          label: 'Todos los jugadores',         short: 'Todos',         icon: 'groups' },
  { value: 'seguro_vigente', label: 'Jugadores con seguro pagado', short: 'Seguro pagado', icon: 'verified_user' },
  { value: 'seguro_vencido', label: 'Jugadores con seguro vencido',short: 'No pagado',     icon: 'gpp_bad' },
  { value: 'equipo',         label: 'Por equipo',                  short: 'Equipo',        icon: 'sports_soccer' },
  { value: 'torneo',         label: 'Por torneo',                  short: 'Torneo',        icon: 'emoji_events' },
  { value: 'categoria',      label: 'Por categoria',               short: 'Categoria',     icon: 'category' },
]

const ASUNTO_MAX = 80
const MENSAJE_MAX = 500
const TITULO_CUPON_MAX = 60

const couponColorOptions: { value: CouponColor; label: string; swatch: string; preview: string; active: string }[] = [
  { value: 'amber', label: 'Amarillo', swatch: 'bg-amber-500', preview: 'from-amber-400 via-amber-500 to-orange-500 shadow-amber-500/20', active: 'ring-amber-500 border-amber-400' },
  { value: 'blue', label: 'Azul', swatch: 'bg-blue-500', preview: 'from-blue-500 via-sky-500 to-cyan-500 shadow-blue-500/20', active: 'ring-blue-500 border-blue-400' },
  { value: 'green', label: 'Verde', swatch: 'bg-green-500', preview: 'from-green-500 via-emerald-500 to-teal-500 shadow-green-500/20', active: 'ring-green-500 border-green-400' },
  { value: 'red', label: 'Rojo', swatch: 'bg-red-500', preview: 'from-red-500 via-rose-500 to-pink-500 shadow-red-500/20', active: 'ring-red-500 border-red-400' },
  { value: 'purple', label: 'Violeta', swatch: 'bg-purple-500', preview: 'from-purple-500 via-violet-500 to-fuchsia-500 shadow-purple-500/20', active: 'ring-purple-500 border-purple-400' },
]

function getCouponColor(value: CouponColor) {
  return couponColorOptions.find(option => option.value === value) || couponColorOptions[0]
}

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
  if (diffD < 30) return `Hace ${Math.floor(diffD / 7)} sem`
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function tipoFiltroLabel(tipo: string): string {
  return tipoDestinatarioOptions.find(o => o.value === tipo)?.short || tipo
}

function tipoFiltroIcon(tipo: string): string {
  return tipoDestinatarioOptions.find(o => o.value === tipo)?.icon || 'notifications'
}

function formatDescuento(tipo: 'porcentaje' | 'monto_fijo', valor: number): string {
  if (tipo === 'porcentaje') return `${Math.min(Math.round(valor), 100)}%`
  return `$${Math.round(valor).toLocaleString('es-AR')}`
}

export default function NotificacionesPanel() {
  const [tipoDestinatario, setTipoDestinatario] = useState('')
  const [filtroId, setFiltroId] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [incluirCupon, setIncluirCupon] = useState(false)
  const [tipoCupon, setTipoCupon] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [valorCupon, setValorCupon] = useState('')
  const [tituloCupon, setTituloCupon] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [colorCupon, setColorCupon] = useState<CouponColor>('amber')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sendProgress, setSendProgress] = useState<{ label: string; percent: number } | null>(null)
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notifTitle, setNotifTitle] = useState('Notificacion enviada')
  const [notifType, setNotifType] = useState<'success' | 'error'>('success')
  const [notifMessage, setNotifMessage] = useState('')

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [historial, setHistorial] = useState<NotificacionEnviadaResponse[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)
  const [historialPage, setHistorialPage] = useState(1)
  const HISTORIAL_PAGE_SIZE = 5

  useEffect(() => {
    getEquipos().then(setEquipos).catch(() => {})
    getTorneos().then(setTorneos).catch(() => {})
    getCategorias().then(setCategorias).catch(() => {})
    getNotificacionesEnviadas()
      .then(setHistorial)
      .catch(() => {})
      .finally(() => setLoadingHistorial(false))
  }, [])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!tipoDestinatario) newErrors.tipoDestinatario = 'Selecciona el tipo de destinatario'
    if (['equipo', 'torneo', 'categoria'].includes(tipoDestinatario) && !filtroId) {
      newErrors.filtroId = 'Selecciona una opcion'
    }
    if (!asunto.trim()) newErrors.asunto = 'El asunto es obligatorio'
    if (!mensaje.trim()) newErrors.mensaje = 'El mensaje es obligatorio'
    if (incluirCupon) {
      if (!tituloCupon.trim()) newErrors.tituloCupon = 'El titulo del cupon es obligatorio'
      if (!valorCupon || parseFloat(valorCupon) <= 0) newErrors.valorCupon = 'El valor del cupon es obligatorio'
      if (!fechaVencimiento) newErrors.fechaVencimiento = 'La fecha de vencimiento es obligatoria'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setConfirmOpen(true)
  }

  const confirmSend = async () => {
    try {
      setConfirmOpen(false)
      setSending(true)
      setSendProgress({ label: 'Preparando envio', percent: 15 })
      const data: CreateNotificacionData = {
        titulo: asunto.trim(),
        mensaje: mensaje.trim(),
        tipo_filtro: tipoDestinatario as CreateNotificacionData['tipo_filtro'],
        filtro_id: filtroId || undefined,
        con_cupon: incluirCupon,
      }
      if (incluirCupon) {
        data.cupon = {
          titulo: tituloCupon.trim(),
          tipo_descuento: tipoCupon,
          valor_descuento: parseFloat(valorCupon),
          fecha_vencimiento: fechaVencimiento,
          color: colorCupon,
        }
      }
      setSendProgress({
        label: incluirCupon ? 'Creando plantilla de cupon en servidor' : 'Creando notificacion en servidor',
        percent: 45,
      })
      const result = await createNotificacion(data)
      setSendProgress({ label: 'Finalizando envio', percent: 90 })
      setNotifTitle('Notificacion enviada')
      setNotifType('success')
      setNotifMessage(
        incluirCupon
          ? `Notificacion enviada a ${result.destinatarios_count} jugadores. Se creo una plantilla de cupon de ${formatDescuento(tipoCupon, parseFloat(valorCupon))}; cada codigo se generara cuando el jugador lo abra.`
          : `Notificacion enviada a ${result.destinatarios_count} jugadores.`
      )
      setShowNotification(true)
    } catch (error) {
      setNotifTitle('Error al enviar')
      setNotifType('error')
      setNotifMessage(error instanceof Error ? error.message : 'Error al enviar')
      setShowNotification(true)
    } finally {
      setSending(false)
      setSendProgress(null)
    }
  }

  const handleNotificationClose = () => {
    setShowNotification(false)
    if (notifType !== 'success') return
    setTipoDestinatario('')
    setFiltroId('')
    setAsunto('')
    setMensaje('')
    setIncluirCupon(false)
    setValorCupon('')
    setTituloCupon('')
    setFechaVencimiento('')
    setColorCupon('amber')
    getNotificacionesEnviadas()
      .then((data) => { setHistorial(data); setHistorialPage(1) })
      .catch(() => {})
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
  }

  const handleEliminarCupon = async (notificacion: NotificacionEnviadaResponse) => {
    const ok = window.confirm('Eliminar este cupon? Dejaremos los cupones ya usados en el historial.')
    if (!ok) return

    try {
      setDeletingCouponId(notificacion.id)
      await eliminarCuponNotificacion(notificacion.id)
      setHistorial(prev => prev.map(item =>
        item.id === notificacion.id
          ? { ...item, cupon_eliminado_at: new Date().toISOString() }
          : item
      ))
    } catch (error) {
      setNotifTitle('Error al eliminar cupon')
      setNotifType('error')
      setNotifMessage(error instanceof Error ? error.message : 'No se pudo eliminar el cupon')
      setShowNotification(true)
    } finally {
      setDeletingCouponId(null)
    }
  }

  const needsSecondDropdown = ['equipo', 'torneo', 'categoria'].includes(tipoDestinatario)

  const totalHistorialPages = Math.max(1, Math.ceil(historial.length / HISTORIAL_PAGE_SIZE))
  const historialPaginado = historial.slice(
    (historialPage - 1) * HISTORIAL_PAGE_SIZE,
    historialPage * HISTORIAL_PAGE_SIZE
  )

  // Cupon preview values
  const cuponValorNum = valorCupon ? parseInt(valorCupon, 10) : 0
  const cuponValorTexto = cuponValorNum > 0 ? formatDescuento(tipoCupon, cuponValorNum) : '—'
  const cuponFechaTexto = fechaVencimiento
    ? new Date(fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'sin fecha'
  const cuponColor = getCouponColor(colorCupon)
  const confirmMessage = incluirCupon
    ? `Vas a enviar una notificacion con una plantilla de cupon ${cuponValorTexto} a "${tipoFiltroLabel(tipoDestinatario)}". Los codigos se generaran cuando cada jugador abra el cupon.`
    : `Vas a enviar una notificacion a "${tipoFiltroLabel(tipoDestinatario)}".`

  // Shared input class
  const inputBase =
    'w-full px-4 py-2.5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:bg-white/80 dark:focus:bg-slate-900/60 focus:ring-2 focus:ring-primary/30 focus:border-primary/50'
  const inputBorderOk = 'border-slate-200/80 dark:border-slate-700/60'
  const inputBorderErr = 'border-red-400/70 focus:ring-red-400/30 focus:border-red-400'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <span className="material-symbols-outlined text-white text-2xl">campaign</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notificaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Envia mensajes y cupones a tus jugadores</p>
        </div>
      </div>

      {/* Glass form */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/70 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/30 space-y-7"
      >
        {/* Step 1: Destinatarios */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Destinatarios</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tipoDestinatarioOptions.map(opt => {
              const active = tipoDestinatario === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTipoDestinatario(opt.value)
                    setFiltroId('')
                    clearError('tipoDestinatario')
                    clearError('filtroId')
                  }}
                  className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border backdrop-blur-md transition-all duration-200 ${
                    active
                      ? 'bg-primary/10 border-primary/50 text-primary shadow-md shadow-primary/10 ring-2 ring-primary/20'
                      : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:bg-white/70 dark:hover:bg-slate-900/50'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${active ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>
                    {opt.icon}
                  </span>
                  <span className="text-[11px] font-medium leading-tight text-center">{opt.short}</span>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] leading-none">check</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {errors.tipoDestinatario && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.tipoDestinatario}</p>}

          {needsSecondDropdown && (
            <div className="mt-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg pointer-events-none">
                  {tipoDestinatario === 'equipo' ? 'sports_soccer' : tipoDestinatario === 'torneo' ? 'emoji_events' : 'category'}
                </span>
                <select
                  value={filtroId}
                  onChange={(e) => { setFiltroId(e.target.value); clearError('filtroId') }}
                  className={`${inputBase} pl-10 pr-9 appearance-none cursor-pointer ${errors.filtroId ? inputBorderErr : inputBorderOk}`}
                >
                  <option value="">
                    {tipoDestinatario === 'equipo' ? 'Seleccionar equipo' : tipoDestinatario === 'torneo' ? 'Seleccionar torneo' : 'Seleccionar categoria'}
                  </option>
                  {tipoDestinatario === 'equipo' && equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  {tipoDestinatario === 'torneo' && torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  {tipoDestinatario === 'categoria' && categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg pointer-events-none">
                  unfold_more
                </span>
              </div>
              {errors.filtroId && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.filtroId}</p>}
            </div>
          )}
        </section>

        {/* Step 2: Mensaje */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Mensaje</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-lg pointer-events-none">title</span>
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => { setAsunto(e.target.value.slice(0, ASUNTO_MAX)); clearError('asunto') }}
                  placeholder="Asunto"
                  className={`${inputBase} pl-10 pr-14 ${errors.asunto ? inputBorderErr : inputBorderOk}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                  {asunto.length}/{ASUNTO_MAX}
                </span>
              </div>
              {errors.asunto && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.asunto}</p>}
            </div>

            <div>
              <div className="relative">
                <textarea
                  value={mensaje}
                  onChange={(e) => { setMensaje(e.target.value.slice(0, MENSAJE_MAX)); clearError('mensaje') }}
                  placeholder="Escribi el mensaje para los jugadores..."
                  className={`${inputBase} min-h-[120px] resize-none ${errors.mensaje ? inputBorderErr : inputBorderOk}`}
                />
                <span className="absolute right-3 bottom-2.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                  {mensaje.length}/{MENSAJE_MAX}
                </span>
              </div>
              {errors.mensaje && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.mensaje}</p>}
            </div>
          </div>
        </section>

        {/* Step 3: Cupon opcional */}
        <section>
          <div
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 ${
              incluirCupon
                ? 'bg-gradient-to-br from-amber-50/80 via-white/40 to-amber-50/40 dark:from-amber-500/10 dark:via-slate-900/30 dark:to-amber-500/5 border-amber-300/50 dark:border-amber-400/20'
                : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-700/50'
            }`}
          >
            {/* Toggle header */}
            <button
              type="button"
              onClick={() => setIncluirCupon(!incluirCupon)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                incluirCupon
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                <span className="material-symbols-outlined text-xl">local_offer</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Incluir cupon de descuento</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Se creara una plantilla; cada codigo se genera al abrirlo</p>
              </div>
              {/* iOS toggle */}
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                incluirCupon ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
                  incluirCupon ? 'left-[22px]' : 'left-0.5'
                }`} />
              </div>
            </button>

            {/* Cupon fields */}
            {incluirCupon && (
              <div className="px-4 pb-4 space-y-4 border-t border-amber-200/40 dark:border-amber-400/10 pt-4">
                {/* Titulo */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Titulo del cupon</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tituloCupon}
                      onChange={(e) => { setTituloCupon(e.target.value.slice(0, TITULO_CUPON_MAX)); clearError('tituloCupon') }}
                      placeholder="Ej: Descuento en cantina"
                      className={`${inputBase} pr-14 ${errors.tituloCupon ? inputBorderErr : inputBorderOk}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                      {tituloCupon.length}/{TITULO_CUPON_MAX}
                    </span>
                  </div>
                  {errors.tituloCupon && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.tituloCupon}</p>}
                </div>

                {/* Tipo de descuento */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Tipo de descuento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoCupon('porcentaje')
                        if (valorCupon && parseInt(valorCupon, 10) > 100) setValorCupon('100')
                      }}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border backdrop-blur-md text-sm font-medium transition-all ${
                        tipoCupon === 'porcentaje'
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-sm'
                          : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-amber-400/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">percent</span>
                      Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCupon('monto_fijo')}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border backdrop-blur-md text-sm font-medium transition-all ${
                        tipoCupon === 'monto_fijo'
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-700 dark:text-amber-300 shadow-sm'
                          : 'bg-white/40 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-amber-400/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">attach_money</span>
                      Monto fijo
                    </button>
                  </div>
                </div>

                {/* Valor + Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Valor</label>
                    <div className="relative flex items-center">
                      {tipoCupon === 'monto_fijo' && (
                        <span className="absolute left-3 text-sm font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">$</span>
                      )}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(() => {
                          if (!valorCupon) return ''
                          const num = parseInt(valorCupon, 10)
                          if (isNaN(num)) return valorCupon
                          return tipoCupon === 'monto_fijo' ? num.toLocaleString('es-AR') : valorCupon
                        })()}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          if (!digits) { setValorCupon(''); clearError('valorCupon'); return }
                          const num = parseInt(digits, 10)
                          setValorCupon(String(tipoCupon === 'porcentaje' ? Math.min(num, 100) : num))
                          clearError('valorCupon')
                        }}
                        placeholder={tipoCupon === 'porcentaje' ? '15' : '1.500'}
                        className={`${inputBase} ${tipoCupon === 'monto_fijo' ? 'pl-7 pr-3' : 'px-4 pr-9'} ${errors.valorCupon ? inputBorderErr : inputBorderOk}`}
                      />
                      {tipoCupon === 'porcentaje' && (
                        <span className="absolute right-3 text-sm font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">%</span>
                      )}
                    </div>
                    {errors.valorCupon && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.valorCupon}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Vencimiento</label>
                    <DatePicker
                      value={fechaVencimiento}
                      onChange={(val) => { setFechaVencimiento(val); clearError('fechaVencimiento') }}
                      placeholder="dd/mm/aaaa"
                      hasError={!!errors.fechaVencimiento}
                    />
                    {errors.fechaVencimiento && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{errors.fechaVencimiento}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">Color del cupon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {couponColorOptions.map(option => {
                      const active = colorCupon === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setColorCupon(option.value)}
                          className={`h-10 rounded-xl border bg-white/50 dark:bg-slate-900/30 flex items-center justify-center transition-all ${active ? `ring-2 ${option.active}` : 'border-slate-200/70 dark:border-slate-700/50 hover:border-slate-400/60'}`}
                          aria-label={option.label}
                          title={option.label}
                        >
                          <span className={`w-5 h-5 rounded-full ${option.swatch}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Preview del cupon */}
                <div className="mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Vista previa</p>
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${cuponColor.preview} p-4 text-white shadow-lg`}>
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wider opacity-80">Cupon</p>
                        <p className="font-bold text-sm truncate">{tituloCupon || 'Titulo del cupon'}</p>
                        <p className="text-[11px] opacity-90 mt-0.5">Vence el {cuponFechaTexto}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-extrabold text-2xl leading-none tracking-tight">{cuponValorTexto}</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1">descuento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="w-full relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/95 hover:to-primary/70 text-white rounded-xl py-3.5 font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="relative">Enviando...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg relative">send</span>
              <span className="relative">Enviar notificacion</span>
            </>
          )}
        </button>
      </form>

      {/* Historial */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historial</h2>
          {historial.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300">
              {historial.length} {historial.length === 1 ? 'enviada' : 'enviadas'}
            </span>
          )}
        </div>

        {loadingHistorial ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/5 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">inbox</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">No hay notificaciones enviadas</p>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {historialPaginado.map(notif => (
                <div
                  key={notif.id}
                  className="group bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/80 dark:hover:bg-slate-800/60 hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notif.con_cupon
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {notif.con_cupon ? 'local_offer' : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{notif.titulo}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100/80 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[11px] rounded-full">
                        <span className="material-symbols-outlined text-[12px]">{tipoFiltroIcon(notif.tipo_filtro)}</span>
                        {tipoFiltroLabel(notif.tipo_filtro)}
                      </span>
                      {notif.con_cupon && (
                        <span className={`inline-block px-2 py-0.5 text-[11px] rounded-full border font-medium ${
                          notif.cupon_eliminado_at
                            ? 'bg-slate-100/80 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-600/50'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {notif.cupon_eliminado_at ? 'Cupon eliminado' : 'Con cupon'}
                        </span>
                      )}
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                  {notif.con_cupon && !notif.cupon_eliminado_at && (
                    <button
                      type="button"
                      onClick={() => handleEliminarCupon(notif)}
                      disabled={deletingCouponId === notif.id}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                      aria-label="Eliminar cupon"
                      title="Eliminar cupon"
                    >
                      {deletingCouponId === notif.id ? (
                        <span className="block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-lg">delete</span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {historial.length > HISTORIAL_PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {(historialPage - 1) * HISTORIAL_PAGE_SIZE + 1}–{Math.min(historialPage * HISTORIAL_PAGE_SIZE, historial.length)} de {historial.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistorialPage(p => Math.max(1, p - 1))}
                    disabled={historialPage === 1}
                    className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_left</span>
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
                    {historialPage} / {totalHistorialPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistorialPage(p => Math.min(totalHistorialPages, p + 1))}
                    disabled={historialPage === totalHistorialPages}
                    className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NotificationModal
        isOpen={showNotification}
        onClose={handleNotificationClose}
        title={notifTitle}
        message={notifMessage}
        type={notifType}
      />

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Confirmar envio</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{confirmMessage}</p>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors"
              >
                Revisar
              </button>
              <button
                type="button"
                onClick={confirmSend}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {sendProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enviando</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sendProgress.label}</p>
            <div className="mt-5 h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${sendProgress.percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-right">{sendProgress.percent}%</p>
          </div>
        </div>
      )}
    </div>
  )
}
