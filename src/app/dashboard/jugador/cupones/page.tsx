'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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

  // Swipe-to-dismiss
  const dragY = useRef(0)
  const startY = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = useState(0)
  const [snapping, setSnapping] = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    dragY.current = 0
    setSnapping(false)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current
    if (delta < 0) return // solo hacia abajo
    dragY.current = delta
    setTranslateY(delta)
  }

  const onTouchEnd = () => {
    setSnapping(true)
    if (dragY.current > 120) {
      setTranslateY(window.innerHeight)
      setTimeout(() => { setSelected(null); setTranslateY(0); setSnapping(false) }, 250)
    } else {
      setTranslateY(0)
      setTimeout(() => setSnapping(false), 250)
    }
  }

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
      <div className="space-y-3 px-0">
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
            const isDisponible = estado === 'disponible'

            const accentBg = isDisponible
              ? 'bg-primary'
              : estado === 'usado'
              ? 'bg-slate-300 dark:bg-slate-600'
              : 'bg-red-300 dark:bg-red-700'

            const iconBg = isDisponible
              ? 'bg-primary/10 dark:bg-primary/15'
              : estado === 'usado'
              ? 'bg-slate-100 dark:bg-slate-700'
              : 'bg-red-50 dark:bg-red-500/10'

            const iconColor = isDisponible
              ? 'text-primary'
              : estado === 'usado'
              ? 'text-slate-400'
              : 'text-red-400'

            const valueColor = isDisponible
              ? 'text-primary'
              : 'text-slate-400 dark:text-slate-500'

            return (
              <button
                key={cupon.id}
                onClick={() => setSelected(cupon)}
                className={`w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-all active:scale-[0.98] ${
                  isDisponible
                    ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                    : 'opacity-60'
                }`}
              >
                <div className="flex items-stretch">
                  {/* Left accent strip */}
                  <div className={`w-1.5 shrink-0 ${accentBg}`} />

                  {/* Icon */}
                  <div className={`w-14 shrink-0 flex items-center justify-center ${iconBg}`}>
                    <span
                      className={`material-symbols-outlined text-2xl ${iconColor}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {cupon.tipo_descuento === 'porcentaje' ? 'percent' : 'payments'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-3 py-3.5 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight line-clamp-1">
                      {cupon.titulo}
                    </p>
                    <p className={`text-xl font-black mt-0.5 leading-none ${valueColor}`}>
                      {cupon.tipo_descuento === 'porcentaje'
                        ? `${cupon.valor_descuento}% OFF`
                        : `$${cupon.valor_descuento.toLocaleString('es-AR')}`
                      }
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[13px] text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {estado === 'usado' ? 'check_circle' : 'calendar_today'}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {estado === 'usado'
                          ? 'Utilizado'
                          : cupon.fecha_vencimiento
                          ? `Vence el ${formatDate(cupon.fecha_vencimiento)}`
                          : 'Sin vencimiento'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <div className="flex items-center pr-3">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSelected(null); setTranslateY(0) }} />
          <div
            ref={sheetRef}
            className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ transform: `translateY(${translateY}px)`, transition: snapping ? 'transform 0.25s ease' : 'none' }}
          >
            {/* Drag handle mobile */}
            <div
              className="flex justify-center pt-3 pb-1 sm:hidden touch-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.titulo}</h3>
                  <p className="text-2xl font-bold text-primary mt-0.5">
                    {selected.tipo_descuento === 'porcentaje' ? `${selected.valor_descuento}% OFF` : `$${selected.valor_descuento.toLocaleString()} OFF`}
                  </p>
                </div>
                <button onClick={() => { setSelected(null); setTranslateY(0) }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  <span className="material-symbols-outlined text-slate-400">close</span>
                </button>
              </div>

              {/* QR Code - solo en disponibles */}
              {getEstado(selected) === 'disponible' ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeSVG
                      value={selected.codigo}
                      size={180}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 w-full">
                    <span className="font-mono text-base font-bold tracking-widest text-slate-900 dark:text-white flex-1 text-center">{selected.codigo}</span>
                    <button
                      onClick={() => copyCode(selected.codigo)}
                      className="text-primary shrink-0"
                    >
                      <span className="material-symbols-outlined text-xl">{copied ? 'check' : 'content_copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Mostrá este QR en la cantina para canjearlo</p>
                </div>
              ) : (
                <div className={`rounded-xl p-4 text-center ${getEstado(selected) === 'usado' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-red-50 dark:bg-red-500/10'}`}>
                  <span className={`material-symbols-outlined text-4xl ${getEstado(selected) === 'usado' ? 'text-slate-400' : 'text-red-400'}`}>
                    {getEstado(selected) === 'usado' ? 'check_circle' : 'event_busy'}
                  </span>
                  <p className={`text-sm font-semibold mt-1 ${getEstado(selected) === 'usado' ? 'text-slate-500 dark:text-slate-400' : 'text-red-500'}`}>
                    {getEstado(selected) === 'usado' ? 'Cupon ya utilizado' : 'Cupon vencido'}
                  </p>
                  <p className="font-mono text-xs text-slate-400 mt-2">{selected.codigo}</p>
                </div>
              )}

              <div className="space-y-2.5 text-sm border-t border-slate-100 dark:border-slate-700 pt-4">
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
                onClick={() => { setSelected(null); setTranslateY(0) }}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl text-sm font-bold transition-colors"
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
