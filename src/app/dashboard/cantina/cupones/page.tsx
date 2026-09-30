'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getResumenCupones, getPuntosConfig, PuntosConfigResponse, ResumenCuponesResponse } from '@/lib/api'
import RegistrarCompraWizard from '@/components/cantina/RegistrarCompraWizard'
import EntregarRecompensaModal from '@/components/cantina/EntregarRecompensaModal'
import DateTimePicker from '@/components/ui/DateTimePicker'

const RECENT_PAGE_SIZE = 10

function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatHora(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function toLocalDateTimeValue(date: string, time: string): number {
  return new Date(`${date}T${time || '00:00'}:00`).getTime()
}

function toLocalDateTimeString(date: string, time: string): string {
  return `${date}T${time || '00:00'}:00`
}

export default function CantinaCajaPage() {
  const [puntosConfig, setPuntosConfig] = useState<PuntosConfigResponse | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [showEntregar, setShowEntregar] = useState(false)

  useEffect(() => {
    getPuntosConfig().then(setPuntosConfig).catch(() => setPuntosConfig(null))
  }, [])

  // === Summary state ===
  const [resumen, setResumen] = useState<ResumenCuponesResponse | null>(null)
  const [resumenLoading, setResumenLoading] = useState(true)
  const [desde, setDesde] = useState(todayDate)
  const [hasta, setHasta] = useState(todayDate)
  const [horaDesde, setHoraDesde] = useState('00:00')
  const [horaHasta, setHoraHasta] = useState('23:59')
  const [recentPage, setRecentPage] = useState(1)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const updateDesde = (nextDate = desde, nextTime = horaDesde) => {
    setDesde(nextDate)
    setHoraDesde(nextTime)
    if (toLocalDateTimeValue(nextDate, nextTime) > toLocalDateTimeValue(hasta, horaHasta)) {
      setHasta(nextDate)
      setHoraHasta(nextTime)
    }
  }

  const updateHasta = (nextDate = hasta, nextTime = horaHasta) => {
    if (toLocalDateTimeValue(nextDate, nextTime) < toLocalDateTimeValue(desde, horaDesde)) return
    setHasta(nextDate)
    setHoraHasta(nextTime)
  }

  const setHoyCompleto = () => {
    const today = todayDate()
    setDesde(today)
    setHoraDesde('00:00')
    setHasta(today)
    setHoraHasta('23:59')
  }

  // === Fetch summary ===
  const fetchResumen = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setResumenLoading(true)
      const inicio = new Date(`${desde}T${horaDesde || '00:00'}:00`)
      const fin = new Date(`${hasta}T${horaHasta || '23:59'}:59`)
      const data = await getResumenCupones(inicio.toISOString(), fin.toISOString())
      setResumen(data)
      if (showLoader) setRecentPage(1)
    } catch {
      // silent fail on polling
    } finally {
      setResumenLoading(false)
    }
  }, [desde, hasta, horaDesde, horaHasta])

  // Initial load + polling every 30s
  useEffect(() => {
    fetchResumen(true)
    pollingRef.current = setInterval(() => fetchResumen(false), 30000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchResumen])

  const totales = resumen?.totales ?? { total_canjes: 0, total_compras: 0, total_descuentos: 0, total_cobrado: 0 }
  const totalRecentPages = Math.max(1, Math.ceil((resumen?.cupones.length ?? 0) / RECENT_PAGE_SIZE))
  const recentPageSafe = Math.min(recentPage, totalRecentPages)
  const recentCupones = (resumen?.cupones ?? []).slice(
    (recentPageSafe - 1) * RECENT_PAGE_SIZE,
    recentPageSafe * RECENT_PAGE_SIZE
  )


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Registrá cada venta de la cantina y controlá el resumen del turno</p>
      </div>

      {/* === HERO ACTIONS === */}
      <div className="max-w-md mx-auto lg:mx-0 space-y-3">
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="w-full min-h-[96px] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 text-xl font-bold transition-colors flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-4xl">point_of_sale</span>
          Registrar compra
        </button>
        <button
          type="button"
          onClick={() => setShowEntregar(true)}
          className="w-full min-h-12 bg-white dark:bg-slate-800 border-2 border-primary text-primary hover:bg-primary/5 rounded-lg text-base font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-2xl">redeem</span>
          Entregar recompensa
        </button>
      </div>

      {/* === SHIFT SUMMARY === */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 sm:p-5">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">point_of_sale</span>
            Resumen de turno
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filtra los canjes por fecha y hora para cerrar cada turno.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Desde</label>
              <DateTimePicker
                dateValue={desde}
                timeValue={horaDesde}
                onDateChange={(value) => updateDesde(value, horaDesde)}
                onTimeChange={(value) => updateDesde(desde, value)}
                placeholder="Inicio del turno"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Hasta</label>
              <DateTimePicker
                dateValue={hasta}
                timeValue={horaHasta}
                onDateChange={(value) => updateHasta(value, horaHasta)}
                onTimeChange={(value) => updateHasta(hasta, value)}
                placeholder="Fin del turno"
                minDateTime={toLocalDateTimeString(desde, horaDesde)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:flex">
              <button
                type="button"
                onClick={setHoyCompleto}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Hoy completo
              </button>
              <button
                onClick={() => fetchResumen(true)}
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Consultar
              </button>
            </div>
          </div>
        </div>

        {/* Metric cards */}
        {resumenLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <span className="material-symbols-outlined text-primary">confirmation_number</span>
                  </div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Canjes</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{totales.total_canjes}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <span className="material-symbols-outlined text-indigo-400">shopping_cart</span>
                  </div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Ventas</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">${totales.total_compras.toLocaleString()}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <span className="material-symbols-outlined text-red-400">sell</span>
                  </div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Descuentos</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-red-400">-${totales.total_descuentos.toLocaleString()}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <span className="material-symbols-outlined text-green-400">payments</span>
                  </div>
                  <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total cobrado</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">${totales.total_cobrado.toLocaleString()}</p>
              </div>
            </div>

            {/* Recent redemptions table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Canjes recientes
              </h3>
              {!resumen || resumen.cupones.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">receipt_long</span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">No hay canjes en este turno</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                        <th className="px-4 py-3 font-medium">Hora</th>
                        <th className="px-4 py-3 font-medium">Codigo</th>
                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Jugador</th>
                        <th className="px-4 py-3 font-medium text-right">Compra</th>
                        <th className="px-4 py-3 font-medium text-right">Descuento</th>
                        <th className="px-4 py-3 font-medium text-right">Cobrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCupones.map((c) => (
                        <tr key={c.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatHora(c.usado_at)}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{c.codigo}</td>
                          <td className="px-4 py-3 text-slate-900 dark:text-white hidden sm:table-cell">
                            {c.jugadores.apellido} {c.jugadores.nombre}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${Number(c.monto_compra).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-400">
                            -${Number(c.monto_descuento).toLocaleString()}
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({c.tipo_descuento === 'porcentaje' ? `${c.valor_descuento}%` : `$${c.valor_descuento}`})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                            ${Number(c.monto_total).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {resumen && resumen.cupones.length > RECENT_PAGE_SIZE && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {(recentPageSafe - 1) * RECENT_PAGE_SIZE + 1}–{Math.min(recentPageSafe * RECENT_PAGE_SIZE, resumen.cupones.length)} de {resumen.cupones.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRecentPage(p => Math.max(1, p - 1))}
                      disabled={recentPageSafe === 1}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_left</span>
                    </button>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
                      {recentPageSafe} / {totalRecentPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRecentPage(p => Math.min(totalRecentPages, p + 1))}
                      disabled={recentPageSafe === totalRecentPages}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <RegistrarCompraWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        puntosActivos={!!puntosConfig?.activo}
        onCompleted={() => fetchResumen(false)}
      />
      <EntregarRecompensaModal isOpen={showEntregar} onClose={() => setShowEntregar(false)} />
    </div>
  )
}
