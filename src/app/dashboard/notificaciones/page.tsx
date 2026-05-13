'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  NotificacionDestinatarioResponse,
} from '@/lib/api'

type Filtro = 'no_leidas' | 'leidas'

const PAGE_SIZE = 10

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificacionesPage() {
  const router = useRouter()
  const [notificaciones, setNotificaciones] = useState<NotificacionDestinatarioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<NotificacionDestinatarioResponse | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('no_leidas')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const initialLoadDone = useRef(false)

  const fetchNotificaciones = useCallback(async (p: number, f: Filtro) => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const res = await getMisNotificaciones(p, PAGE_SIZE, f)
      setNotificaciones(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
      initialLoadDone.current = true
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotificaciones(page, filtro)
  }, [fetchNotificaciones, page, filtro])

  useEffect(() => {
    const interval = setInterval(() => fetchNotificaciones(page, filtro), 30000)
    return () => clearInterval(interval)
  }, [fetchNotificaciones, page, filtro])

  const handleClick = async (notif: NotificacionDestinatarioResponse) => {
    if (!notif.leida) {
      await marcarNotificacionLeida(notif.id).catch(() => {})
      setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leida: true } : n))
      window.dispatchEvent(new Event('notifications:read'))
    }
    setSelected({ ...notif, leida: true })
  }

  const handleMarkAllRead = async () => {
    await marcarTodasNotificacionesLeidas().catch(() => {})
    window.dispatchEvent(new Event('notifications:read'))
    fetchNotificaciones(1, filtro)
    setPage(1)
  }

  const switchFiltro = (f: Filtro) => {
    if (f === filtro) return
    setFiltro(f)
    setPage(1)
  }

  if (loading && !initialLoadDone.current) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-6">
      {/* Header con gradiente */}
      <div className="-mx-3 -mt-4 md:-mx-4 md:-mt-8 mb-5">
        <div className="bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5 pt-2 pb-5 px-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                {filtro === 'no_leidas' ? `${total} sin leer` : `${total} leidas`}
              </p>
            </div>
            {filtro === 'no_leidas' && total > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Leer todas
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              onClick={() => switchFiltro('no_leidas')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                filtro === 'no_leidas'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              No leidas
            </button>
            <button
              onClick={() => switchFiltro('leidas')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                filtro === 'leidas'
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Leidas
            </button>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
            {filtro === 'no_leidas' ? 'mark_email_read' : 'inbox'}
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
            {filtro === 'no_leidas' ? 'No tenes notificaciones sin leer' : 'No tenes notificaciones leidas'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          {notificaciones.map((notif, idx) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                !notif.leida ? 'bg-primary/[0.03] dark:bg-primary/[0.06]' : ''
              } ${idx !== notificaciones.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border-2 ${
                  !notif.leida
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700'
                }`}>
                  <span className={`material-symbols-outlined text-lg ${
                    !notif.leida ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {notif.notificaciones.con_cupon ? 'sell' : 'notifications'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${
                      !notif.leida
                        ? 'font-bold text-primary'
                        : 'font-semibold text-slate-700 dark:text-slate-300'
                    }`}>
                      {notif.notificaciones.titulo}
                    </p>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 mt-0.5">
                      {formatDateShort(notif.notificaciones.created_at)}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 line-clamp-2 ${
                    !notif.leida
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {notif.notificaciones.mensaje}
                  </p>
                  {notif.notificaciones.con_cupon && (
                    <span className="inline-flex items-center gap-0.5 mt-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold rounded-full border border-amber-500/20">
                      <span className="material-symbols-outlined text-[10px]">confirmation_number</span>
                      Cupon incluido
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paginación */}
      {total > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_left</span>
            </button>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {selected.notificaciones.titulo}
                </h3>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md shrink-0">
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {formatDateFull(selected.notificaciones.created_at)}
              </p>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {selected.notificaciones.mensaje}
              </p>

              {selected.notificaciones.con_cupon && (
                <button
                  onClick={() => {
                    setSelected(null)
                    router.push('/dashboard/jugador/cupones')
                  }}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">confirmation_number</span>
                  Ver cupon
                </button>
              )}

              <button
                onClick={() => setSelected(null)}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                  selected.notificaciones.con_cupon
                    ? 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
