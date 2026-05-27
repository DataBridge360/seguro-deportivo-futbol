'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminCouponsReport, getAdminCouponsReport } from '@/lib/api'

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function money(value: number) {
  return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const today = new Date()
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

export default function AdminReportesPage() {
  const [desde, setDesde] = useState(toDateInput(monthStart))
  const [hasta, setHasta] = useState(toDateInput(today))
  const [cantinaId, setCantinaId] = useState('todas')
  const [report, setReport] = useState<AdminCouponsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const start = new Date(`${desde}T00:00:00`)
      const end = new Date(`${hasta}T23:59:59.999`)
      const data = await getAdminCouponsReport({
        desde: start.toISOString(),
        hasta: end.toISOString(),
        cantinaId,
      })
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte')
    } finally {
      setLoading(false)
    }
  }, [cantinaId, desde, hasta])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const maxDailyCanjes = Math.max(1, ...(report?.por_dia.map(row => row.canjes) ?? [0]))
  const maxCantinaCobrado = Math.max(1, ...(report?.por_cantina.map(row => row.total_cobrado) ?? [0]))

  const selectedCantina = useMemo(
    () => report?.cantinas.find(cantina => cantina.id === cantinaId),
    [report, cantinaId],
  )

  const stats = [
    { label: 'Canjes', value: report?.totales.total_canjes ?? 0, icon: 'confirmation_number', color: 'bg-primary/10 text-primary' },
    { label: 'Compras', value: money(report?.totales.total_compras ?? 0), icon: 'shopping_cart', color: 'bg-sky-500/10 text-sky-500' },
    { label: 'Descuentos', value: money(report?.totales.total_descuentos ?? 0), icon: 'sell', color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Cobrado', value: money(report?.totales.total_cobrado ?? 0), icon: 'payments', color: 'bg-emerald-500/10 text-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Uso de cupones por fecha y cantina
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-[150px_150px_220px_auto] gap-2">
          <FilterDate label="Desde" value={desde} onChange={setDesde} />
          <FilterDate label="Hasta" value={hasta} onChange={setHasta} />
          <div className="col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Cantina</label>
            <select
              value={cantinaId}
              onChange={(e) => setCantinaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="todas">Todas las cantinas</option>
              {(report?.cantinas ?? []).map(cantina => (
                <option key={cantina.id} value={cantina.id}>{cantina.nombre}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadReport}
            disabled={loading}
            className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">filter_alt</span>
            Aplicar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300">
          {error}
        </div>
      )}

      {selectedCantina && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          Reporte filtrado por <span className="font-semibold text-slate-900 dark:text-white">{selectedCantina.nombre}</span>
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">{stat.label}</h3>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">bar_chart</span>
            Canjes por dia
          </h2>
          <div className="mt-4 h-72 flex items-end gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-700 pb-2">
            {loading ? (
              <p className="self-center text-sm text-slate-500">Cargando...</p>
            ) : report && report.por_dia.length > 0 ? report.por_dia.map(row => (
              <div key={row.fecha} className="min-w-12 flex-1 flex flex-col items-center justify-end gap-2">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{row.canjes}</div>
                <div
                  className="w-full max-w-12 rounded-t bg-primary"
                  style={{ height: `${Math.max(8, (row.canjes / maxDailyCanjes) * 210)}px` }}
                  title={`${row.canjes} canjes`}
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(row.fecha)}</div>
              </div>
            )) : (
              <p className="self-center text-sm text-slate-500">No hay canjes en el periodo</p>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">point_of_sale</span>
            Cobrado por cantina
          </h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : report && report.por_cantina.length > 0 ? report.por_cantina.map(row => (
              <div key={row.cantina_id}>
                <div className="flex items-center justify-between gap-3 text-sm mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-100 truncate">{row.cantina_nombre}</span>
                  <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{money(row.total_cobrado)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max(3, (row.total_cobrado / maxCantinaCobrado) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{row.canjes} canjes</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No hay datos por cantina</p>
            )}
          </div>
        </section>
      </div>

      <section>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Ultimos cupones usados
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cupon</th>
                <th className="px-4 py-3 font-medium">Cantina</th>
                <th className="px-4 py-3 font-medium text-right">Compra</th>
                <th className="px-4 py-3 font-medium text-right">Descuento</th>
                <th className="px-4 py-3 font-medium text-right">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {(report?.cupones ?? []).map(cupon => (
                <tr key={cupon.id} className="border-b border-slate-200/60 dark:border-slate-700/60">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(cupon.usado_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{cupon.titulo}</p>
                    <p className="text-xs text-slate-500 font-mono">{cupon.codigo || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cupon.cantina_nombre}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{money(cupon.monto_compra)}</td>
                  <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-300">{money(cupon.monto_descuento)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">{money(cupon.monto_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && (report?.cupones.length ?? 0) === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No hay cupones usados en el periodo
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary"
      />
    </div>
  )
}
