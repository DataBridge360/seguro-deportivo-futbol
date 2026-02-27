'use client'

import { useState, useEffect, useMemo } from 'react'
import { getMisCupones, CuponResponse } from '@/lib/api'

type Estado = 'disponible' | 'usado' | 'vencido'

function getEstado(cupon: CuponResponse): Estado {
  if (cupon.usado) return 'usado'
  if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < new Date(new Date().toDateString())) return 'vencido'
  return 'disponible'
}

function estadoBadge(estado: Estado) {
  switch (estado) {
    case 'disponible':
      return 'bg-green-500/10 text-green-500 border-green-500/20'
    case 'usado':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    case 'vencido':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
  }
}

function estadoLabel(estado: Estado) {
  switch (estado) {
    case 'disponible': return 'Disponible'
    case 'usado': return 'Usado'
    case 'vencido': return 'Vencido'
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  return formatDate(dateStr.split('T')[0])
}

const tabs: { key: Estado; label: string; icon: string }[] = [
  { key: 'disponible', label: 'Disponibles', icon: 'confirmation_number' },
  { key: 'usado', label: 'Usados', icon: 'check_circle' },
  { key: 'vencido', label: 'Vencidos', icon: 'event_busy' },
]

export default function CuponesPage() {
  const [cupones, setCupones] = useState<CuponResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CuponResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<Estado>('disponible')

  useEffect(() => {
    getMisCupones()
      .then(setCupones)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const grouped = useMemo(() => {
    const groups: Record<Estado, CuponResponse[]> = { disponible: [], usado: [], vencido: [] }
    cupones.forEach(c => groups[getEstado(c)].push(c))
    return groups
  }, [cupones])

  const filtered = grouped[activeTab]

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mis Cupones</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {cupones.length === 0 ? 'No tenés cupones' : `${cupones.length} cupón${cupones.length !== 1 ? 'es' : ''}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
        {tabs.map(tab => {
          const count = grouped[tab.key].length
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
            {activeTab === 'disponible' ? 'confirmation_number' : activeTab === 'usado' ? 'check_circle' : 'event_busy'}
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            {activeTab === 'disponible' && 'No tenés cupones disponibles'}
            {activeTab === 'usado' && 'No tenés cupones usados'}
            {activeTab === 'vencido' && 'No tenés cupones vencidos'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cupon) => {
            const estado = getEstado(cupon)
            return (
              <button
                key={cupon.id}
                onClick={() => setSelected(cupon)}
                className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-left hover:border-primary transition-colors ${
                  estado !== 'disponible' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${estadoBadge(estado)}`}>
                        {estadoLabel(estado)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs">{timeAgo(cupon.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{cupon.titulo}</p>
                    {cupon.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{cupon.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-primary">
                      {cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {cupon.tipo_descuento === 'porcentaje' ? 'descuento' : 'de descuento'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalle del cupón</h3>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div className="text-center py-3">
              <p className="text-3xl font-bold text-primary">
                {selected.tipo_descuento === 'porcentaje' ? `${selected.valor_descuento}%` : `$${selected.valor_descuento.toLocaleString()}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selected.titulo}</p>
            </div>

            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 flex items-center justify-between">
              <span className="font-mono text-sm text-slate-900 dark:text-white font-bold">{selected.codigo}</span>
              <button
                onClick={() => copyCode(selected.codigo)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estado</span>
                <span className={`font-medium ${getEstado(selected) === 'disponible' ? 'text-green-500' : getEstado(selected) === 'usado' ? 'text-slate-400' : 'text-red-400'}`}>
                  {estadoLabel(getEstado(selected))}
                </span>
              </div>
              {selected.fecha_vencimiento && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Vencimiento</span>
                  <span className="text-slate-900 dark:text-white">{formatDate(selected.fecha_vencimiento)}</span>
                </div>
              )}
              {selected.usado && selected.usado_at && (
                <>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2" />
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Monto compra</span>
                    <span className="text-slate-900 dark:text-white">${Number(selected.monto_compra).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Descuento aplicado</span>
                    <span className="text-green-500 font-medium">-${Number(selected.monto_descuento).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Total pagado</span>
                    <span className="text-slate-900 dark:text-white font-bold">${Number(selected.monto_total).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
