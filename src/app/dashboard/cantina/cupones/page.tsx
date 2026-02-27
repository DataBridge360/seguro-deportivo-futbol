'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { buscarCupon, canjearCupon, CuponResponse, getResumenCupones, ResumenCuponesResponse } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

type Step = 'buscar' | 'preview' | 'monto'

function getEstado(cupon: CuponResponse): 'disponible' | 'usado' | 'vencido' {
  if (cupon.usado) return 'usado'
  if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < new Date(new Date().toDateString())) return 'vencido'
  return 'disponible'
}

function todayStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00`
}

function todayEnd() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T23:59`
}

function formatHora(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function CantinaCajaPage() {
  // === Coupon validation state ===
  const [step, setStep] = useState<Step>('buscar')
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState<CuponResponse | null>(null)
  const [montoCompra, setMontoCompra] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success'
  })

  // === Summary state ===
  const [resumen, setResumen] = useState<ResumenCuponesResponse | null>(null)
  const [resumenLoading, setResumenLoading] = useState(true)
  const [desde, setDesde] = useState(todayStart)
  const [hasta, setHasta] = useState(todayEnd)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // === Fetch summary ===
  const fetchResumen = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setResumenLoading(true)
      const data = await getResumenCupones(new Date(desde).toISOString(), new Date(hasta).toISOString())
      setResumen(data)
    } catch {
      // silent fail on polling
    } finally {
      setResumenLoading(false)
    }
  }, [desde, hasta])

  // Initial load + polling every 30s
  useEffect(() => {
    fetchResumen(true)
    pollingRef.current = setInterval(() => fetchResumen(false), 30000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchResumen])

  // === Coupon handlers ===
  const handleBuscar = async () => {
    if (!codigo.trim()) {
      setError('Ingresa un codigo de cupon')
      return
    }
    try {
      setLoading(true)
      setError('')
      const data = await buscarCupon(codigo.trim())
      setCupon(data)
      const estado = getEstado(data)
      if (estado === 'usado') {
        setError('Este cupon ya fue utilizado')
        return
      }
      if (estado === 'vencido') {
        setError('Este cupon esta vencido')
        return
      }
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cupon no encontrado')
    } finally {
      setLoading(false)
    }
  }

  const handleCanjear = async () => {
    if (!cupon) return
    const monto = parseFloat(montoCompra)
    if (!monto || monto <= 0) {
      setError('Ingresa un monto valido')
      return
    }
    try {
      setLoading(true)
      setError('')
      const result = await canjearCupon(cupon.id, monto)
      setNotification({
        open: true,
        title: 'Cupon canjeado',
        message: `Descuento de $${Number(result.monto_descuento).toLocaleString()} aplicado. Total a cobrar: $${Number(result.monto_total).toLocaleString()}`,
        type: 'success'
      })
      // Re-fetch summary immediately after successful canje
      fetchResumen(false)
    } catch (err) {
      setNotification({
        open: true,
        title: 'Error',
        message: err instanceof Error ? err.message : 'Error al canjear',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('buscar')
    setCodigo('')
    setCupon(null)
    setMontoCompra('')
    setError('')
  }

  const calcDescuento = (): { descuento: number; total: number } | null => {
    if (!cupon || !montoCompra) return null
    const monto = parseFloat(montoCompra)
    if (!monto || monto <= 0) return null
    let descuento: number
    if (cupon.tipo_descuento === 'porcentaje') {
      descuento = Math.round(monto * cupon.valor_descuento / 100 * 100) / 100
    } else {
      descuento = Math.min(cupon.valor_descuento, monto)
    }
    return { descuento, total: Math.round((monto - descuento) * 100) / 100 }
  }

  const totales = resumen?.totales ?? { total_canjes: 0, total_compras: 0, total_descuentos: 0, total_cobrado: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Validar cupones y resumen del dia</p>
      </div>

      {/* === COUPON VALIDATION === */}
      <div className="max-w-md mx-auto lg:mx-0">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
          {/* Step: Buscar */}
          {step === 'buscar' && (
            <>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Codigo del cupon</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError('') }}
                  placeholder="Ej: CUP-ABC123"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-primary ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                />
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </div>
              <button
                onClick={handleBuscar}
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Buscando...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">search</span> Buscar cupon</>
                )}
              </button>
            </>
          )}

          {/* Step: Preview */}
          {step === 'preview' && cupon && (
            <>
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-primary">
                  {cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento.toLocaleString()}`}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cupon.titulo}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">{cupon.codigo}</p>
              </div>
              {cupon.jugadores && (
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-center">
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {cupon.jugadores.apellido} {cupon.jugadores.nombre}
                  </p>
                  <p className="text-xs text-slate-500">DNI: {cupon.jugadores.dni}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={resetForm}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={() => setStep('monto')}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
                  Aplicar descuento
                </button>
              </div>
            </>
          )}

          {/* Step: Monto */}
          {step === 'monto' && cupon && (
            <>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Monto de la compra ($)</label>
                <input
                  type="number"
                  value={montoCompra}
                  onChange={(e) => { setMontoCompra(e.target.value); setError('') }}
                  placeholder="Ej: 5000"
                  className={`w-full px-3 py-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-lg font-bold text-center placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  min="1"
                />
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </div>

              {calcDescuento() && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="text-slate-900 dark:text-white">${parseFloat(montoCompra).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Descuento ({cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento}`})
                    </span>
                    <span className="text-green-500 font-medium">-${calcDescuento()!.descuento.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-900 dark:text-white font-bold">Total a cobrar</span>
                      <span className="text-slate-900 dark:text-white font-bold text-lg">${calcDescuento()!.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setStep('preview'); setMontoCompra(''); setError('') }}
                  className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                  Volver
                </button>
                <button onClick={handleCanjear} disabled={loading}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Canjeando...</>
                  ) : (
                    <><span className="material-symbols-outlined text-lg">check_circle</span> Confirmar canje</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* === DAILY SUMMARY === */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">point_of_sale</span>
            Resumen del dia
          </h2>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="text-xs text-slate-500 hover:text-primary flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Cambiar fecha
          </button>
        </div>

        {/* Date filter (hidden by default) */}
        {showDateFilter && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Desde</label>
                <input
                  type="datetime-local"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Hasta</label>
                <input
                  type="datetime-local"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => fetchResumen(true)}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Consultar
              </button>
            </div>
          </div>
        )}

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
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">No hay canjes hoy</p>
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
                      {resumen.cupones.map((c) => (
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
            </div>
          </>
        )}
      </div>

      <NotificationModal
        isOpen={notification.open}
        onClose={() => { setNotification(prev => ({ ...prev, open: false })); if (notification.type === 'success') resetForm() }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
