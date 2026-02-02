'use client'

import { useRouter } from 'next/navigation'

// Example notifications
const notifications = [
  {
    id: 1,
    icon: 'sell',
    title: 'Te ganaste un cupón de $15.000',
    description: 'Canjealo en cualquier comercio adherido',
    time: 'Hace 2 horas',
    unread: true,
  },
  {
    id: 2,
    icon: 'sports_soccer',
    title: 'El sábado juega tu equipo',
    description: 'No te olvides de confirmar asistencia',
    time: 'Hace 1 día',
    unread: true,
  },
]

export default function NotificacionesPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header - Mobile */}
      <div className="md:hidden mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
      </div>

      {/* Header - Desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
        <button className="text-sm text-primary font-medium hover:underline">
          Marcar todas como leídas
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">notifications_off</span>
            <p className="mt-2 text-slate-500 dark:text-slate-400">No tenés notificaciones</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-white/50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                  index !== notifications.length - 1 ? 'border-b border-slate-200/30 dark:border-slate-700/30' : ''
                }`}
              >
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                    notification.unread
                      ? 'bg-primary/10'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    <span className={`material-symbols-outlined text-[24px] ${
                      notification.unread
                        ? 'text-primary'
                        : 'text-slate-400'
                    }`}>
                      {notification.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-base ${
                        notification.unread
                          ? 'font-semibold text-slate-900 dark:text-white'
                          : 'font-medium text-slate-600 dark:text-slate-300'
                      }`}>
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <span className="flex-shrink-0 block h-2.5 w-2.5 rounded-full bg-primary mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {notification.description}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Mark all as read */}
      <div className="md:hidden mt-4">
        <button className="w-full py-3 text-center text-sm text-primary font-medium rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10">
          Marcar todas como leídas
        </button>
      </div>
    </div>
  )
}
