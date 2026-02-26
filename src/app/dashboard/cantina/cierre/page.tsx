'use client'

import { useState } from 'react'
import { getResumenCupones, ResumenCuponesResponse } from '@/lib/api'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatHora(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function CantinaCierrePage() {
  const hoy = todayStr()
  const [desde, setDesde] = useState(`${hoy}T00:00`)
  const [hasta, setHasta] = useState(`${hoy}T23:59`)
  const [resumen, setResumen] = useState<ResumenCuponesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consultado, setConsultado] = useState(false)

  const handleConsultar = async () => {
    if (!desde || !hasta) {
      setError('Selecciona ambas fechas')
      return
    }
    try {
      setLoading(true)
      setError('')
      const data = await getResumenCupones(new Date(desde).toISOString(), new Date(hasta).toISOString())
      setResumen(data)
      setConsultado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar')
    } finally {
      setLoading(false)
    }
  }

  const totales = resumen?.totales ?? { total_canjes: 0, total_compras: 0, total_descuentos: 0, total_cobrado: 0 }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cierre de Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Resumen de canjes de cupones por rango de fecha</p>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Desde</label>
            <input
              type="datetime-local"
              value={desde}
              onChange={(e) => { setDesde(e.target.value); setError('') }}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Hasta</label>
            <input
              type="datetime-local"
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); setError('') }}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleConsultar}
            disabled={loading}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sm:min-w-[140px]"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Consultando...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">search</span> Consultar</>
            )}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {consultado && resumen && (
        <>
          {/* Cards resumen */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
                  <span className="material-symbols-outlined text-red-400">discount</span>
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

          {/* Tabla de canjes */}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Detalle de canjes
            </h2>
            {resumen.cupones.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">receipt_long</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">No hay canjes en este rango</p>
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

      {!consultado && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">receipt_long</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Selecciona un rango de fechas y consulta</p>
        </div>
      )}
    </div>
  )
}
