'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  NotificacionDestinatarioResponse,
} from '@/lib/api'

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

export default function NotificacionesPage() {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<NotificacionDestinatarioResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMisNotificaciones()
      .then(setNotificaciones)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleClick = async (notif: NotificacionDestinatarioResponse) => {
    if (!notif.leida) {
      await marcarNotificacionLeida(notif.id).catch(() => {})
      setNotificaciones(prev =>
        prev.map(n => n.id === notif.id ? { ...n, leida: true } : n)
      )
    }
    if (notif.notificaciones.con_cupon) {
      router.push('/dashboard/jugador/cupones')
    }
  }

  const handleMarkAllRead = async () => {
    await marcarTodasNotificacionesLeidas().catch(() => {})
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const unreadCount = notificaciones.filter(n => !n.leida).length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">done_all</span>
            Marcar todas como leidas
          </button>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_off</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">No tenes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left rounded-lg p-4 border transition-colors ${
                !notif.leida
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              } hover:border-primary`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  !notif.leida ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  <span className={`material-symbols-outlined text-lg ${
                    !notif.leida ? 'text-primary' : 'text-slate-400'
                  }`}>
                    {notif.notificaciones.con_cupon ? 'sell' : 'notifications'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${!notif.leida ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notif.notificaciones.titulo}
                    </p>
                    {!notif.leida && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.notificaciones.mensaje}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{timeAgo(notif.notificaciones.created_at)}</span>
                    {notif.notificaciones.con_cupon && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-semibold rounded-full border border-amber-500/20">
                        <span className="material-symbols-outlined text-[10px]">confirmation_number</span>
                        Cupon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
