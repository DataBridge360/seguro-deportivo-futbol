'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getMisCupones, CuponResponse } from '@/lib/api'

type Estado = 'disponible' | 'usado' | 'vencido'

function getEstado(cupon: CuponResponse): Estado {
  if (cupon.usado) return 'usado'
  if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < new Date(new Date().toDateString())) return 'vencido'
  return 'disponible'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })
}

const tabs: { key: Estado; label: string }[] = [
  { key: 'disponible', label: 'Disponibles' },
  { key: 'usado', label: 'Usados' },
  { key: 'vencido', label: 'Vencidos' },
]

export default function CuponesPage() {
  const [cupones, setCupones] = useState<CuponResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CuponResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<Estado>('disponible')
  const initialLoadDone = useRef(false)

  const fetchCupones = useCallback(async () => {
    try {
      if (!initialLoadDone.current) setLoading(true)
      const data = await getMisCupones()
      setCupones(data)
      initialLoadDone.current = true
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCupones()
    const interval = setInterval(fetchCupones, 30000)
    return () => clearInterval(interval)
  }, [fetchCupones])

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
    <div className="max-w-lg mx-auto pb-6">
      {/* Header con gradiente */}
      <div className="-mx-3 -mt-4 md:-mx-4 md:-mt-8 mb-0">
        <div className="bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/5 pt-2 pb-6 px-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Mis cupones</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {cupones.length === 0 ? 'No tenes cupones' : `${cupones.length} cupon${cupones.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
      </div>

      {/* Tabs - Estilo underline */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 -mx-3 px-3 md:-mx-4 md:px-4">
        {tabs.map(tab => {
          const count = grouped[tab.key].length
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-all relative ${
                isActive
                  ? 'text-primary'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                  ({count})
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-primary rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Lista de cupones */}
      <div className="space-y-4 px-0">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">
              {activeTab === 'disponible' ? 'confirmation_number' : activeTab === 'usado' ? 'check_circle' : 'event_busy'}
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
              {activeTab === 'disponible' && 'No tenes cupones disponibles'}
              {activeTab === 'usado' && 'No tenes cupones usados'}
              {activeTab === 'vencido' && 'No tenes cupones vencidos'}
            </p>
          </div>
        ) : (
          filtered.map((cupon) => {
            const estado = getEstado(cupon)
            return (
              <div
                key={cupon.id}
                className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm ${
                  estado !== 'disponible' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex p-4 gap-4">
                  {/* Icono / Imagen del cupon */}
                  <div className={`size-16 rounded-xl flex items-center justify-center shrink-0 ${
                    estado === 'disponible'
                      ? 'bg-primary/10'
                      : estado === 'usado'
                      ? 'bg-slate-100 dark:bg-slate-700'
                      : 'bg-red-50 dark:bg-red-500/10'
                  }`}>
                    <span className={`material-symbols-outlined text-3xl ${
                      estado === 'disponible'
                        ? 'text-primary'
                        : estado === 'usado'
                        ? 'text-slate-400'
                        : 'text-red-400'
                    }`}>
                      {cupon.tipo_descuento === 'porcentaje' ? 'percent' : 'payments'}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold text-primary line-clamp-2 leading-snug">
                      {cupon.tipo_descuento === 'porcentaje'
                        ? `${cupon.valor_descuento}% - ${cupon.titulo}`
                        : `$${cupon.valor_descuento.toLocaleString()} - ${cupon.titulo}`
                      }
                    </h3>
                    {cupon.descripcion && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {cupon.descripcion}
                      </p>
                    )}
                    {cupon.fecha_vencimiento && (
                      <span className="inline-block mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                        {estado === 'disponible'
                          ? `Hasta el ${formatDateShort(cupon.fecha_vencimiento)}`
                          : estado === 'vencido'
                          ? `Vencido el ${formatDateShort(cupon.fecha_vencimiento)}`
                          : `Usado`
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer con acciones */}
                {estado === 'disponible' && (
                  <div className="flex items-center border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => setSelected(cupon)}
                      className="flex-1 flex items-center justify-center gap-1 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                    >
                      Ver detalles
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700" />
                    <button
                      onClick={() => copyCode(cupon.codigo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                      {copied ? 'Copiado' : 'Copiar codigo'}
                    </button>
                  </div>
                )}

                {estado !== 'disponible' && (
                  <div className="border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => setSelected(cupon)}
                      className="w-full flex items-center justify-center gap-1 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      Ver detalles
                      <span className="material-symbols-outlined text-base">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Detalle del cupon</h3>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>

              <div className="text-center py-4">
                <div className="size-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    {selected.tipo_descuento === 'porcentaje' ? 'percent' : 'payments'}
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {selected.tipo_descuento === 'porcentaje' ? `${selected.valor_descuento}%` : `$${selected.valor_descuento.toLocaleString()}`}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selected.titulo}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 flex items-center justify-between">
                <span className="font-mono text-sm text-slate-900 dark:text-white font-bold tracking-wider">{selected.codigo}</span>
                <button
                  onClick={() => copyCode(selected.codigo)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Estado</span>
                  <span className={`font-semibold ${
                    getEstado(selected) === 'disponible' ? 'text-green-500' : getEstado(selected) === 'usado' ? 'text-slate-400' : 'text-red-400'
                  }`}>
                    {getEstado(selected) === 'disponible' ? 'Disponible' : getEstado(selected) === 'usado' ? 'Usado' : 'Vencido'}
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
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 mt-2.5" />
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
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors"
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
