'use client'

import { useState, useEffect } from 'react'
import {
  eliminarCuponNotificacion,
  getNotificacionesEnviadas,
  NotificacionEnviadaResponse,
} from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'
import NotificacionWizard from '@/components/notificaciones/NotificacionWizard'

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

export default function NotificacionesPanel({ showHeader = true }: { showHeader?: boolean }) {
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')

  const [historial, setHistorial] = useState<NotificacionEnviadaResponse[]>([])
  const [loadingHistorial, setLoadingHistorial] = useState(true)
  const [historialPage, setHistorialPage] = useState(1)
  const HISTORIAL_PAGE_SIZE = 5

  useEffect(() => {
    getNotificacionesEnviadas()
      .then(setHistorial)
      .catch(() => {})
      .finally(() => setLoadingHistorial(false))
  }, [])

  const refreshHistorial = () => {
    getNotificacionesEnviadas()
      .then((data) => { setHistorial(data); setHistorialPage(1) })
      .catch(() => {})
  }

  const handleEliminarCupon = async (notificacion: NotificacionEnviadaResponse) => {
    const ok = window.confirm('¿Eliminar este cupón? Dejamos los cupones ya usados en el historial.')
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
      setNotifTitle('Error al eliminar cupón')
      setNotifMessage(error instanceof Error ? error.message : 'No se pudo eliminar el cupón')
      setShowNotification(true)
    } finally {
      setDeletingCouponId(null)
    }
  }

  const totalHistorialPages = Math.max(1, Math.ceil(historial.length / HISTORIAL_PAGE_SIZE))
  const historialPaginado = historial.slice(
    (historialPage - 1) * HISTORIAL_PAGE_SIZE,
    historialPage * HISTORIAL_PAGE_SIZE
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">campaign</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notificaciones</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Envia mensajes y cupones a tus jugadores</p>
          </div>
        </div>
      )}

      <NotificacionWizard onSent={refreshHistorial} />

      {/* Historial */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historial</h2>
          {historial.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 text-xs font-medium text-slate-600 dark:text-slate-300">
              {historial.length} {historial.length === 1 ? 'enviada' : 'enviadas'}
            </span>
          )}
        </div>

        {loadingHistorial ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : historial.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 shadow-sm rounded-2xl p-8 text-center">
            <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
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
                  className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 shadow-sm rounded-2xl p-3 flex items-center gap-3"
                >
                  <div className={`size-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.con_cupon
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {notif.con_cupon ? 'local_offer' : 'notifications'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{notif.titulo}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                        <span className="material-symbols-outlined text-sm">{tipoFiltroIcon(notif.tipo_filtro)}</span>
                        {tipoFiltroLabel(notif.tipo_filtro)}
                      </span>
                      {notif.con_cupon && (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full border font-medium ${
                          notif.cupon_eliminado_at
                            ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/50'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {notif.cupon_eliminado_at ? 'Cupon eliminado' : 'Con cupon'}
                        </span>
                      )}
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                  {notif.con_cupon && !notif.cupon_eliminado_at && (
                    <button
                      type="button"
                      onClick={() => handleEliminarCupon(notif)}
                      disabled={deletingCouponId === notif.id}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-[0.96] disabled:opacity-50 transition-colors"
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
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 active:scale-[0.96] disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
        onClose={() => setShowNotification(false)}
        title={notifTitle}
        message={notifMessage}
        type="error"
      />
    </div>
  )
}
