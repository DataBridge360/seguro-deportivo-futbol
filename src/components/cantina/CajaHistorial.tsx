'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { listarCompras, type CompraCajaItem, type ListarComprasData } from '@/lib/api'
import type { CompraConCobrador } from '@/lib/contabilidadClub'
import DateTimePicker from '@/components/ui/DateTimePicker'
import { useAuthStore } from '@/stores/authStore'

const PAGE_SIZE = 20
const POLL_MS = 30000
const MAX_RANGE_DAYS = 93

type Preset = 'hoy' | 'ayer' | '7d' | 'custom'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'ayer', label: 'Ayer' },
  { id: '7d', label: 'Últimos 7 días' },
  { id: 'custom', label: 'Personalizado' },
]

const moneyFmt = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const money = (n: number) => moneyFmt.format(Number(n) || 0)

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toLocalDateTimeValue(date: string, time: string): number {
  return new Date(`${date}T${time || '00:00'}:00`).getTime()
}

function toLocalDateTimeString(date: string, time: string): string {
  return `${date}T${time || '00:00'}:00`
}

interface CustomRange {
  desde: string
  hasta: string
  horaDesde: string
  horaHasta: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const isValidDate = (v: unknown): v is string => typeof v === 'string' && DATE_RE.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime())
const isValidTime = (v: unknown): v is string => typeof v === 'string' && TIME_RE.test(v)

// One stored range per logged-in user (the range is what matters, not the cantina)
function storageKey(): string {
  const userId = useAuthStore.getState().user?.id
  return `caja-historial:${userId ? String(userId) : 'anon'}`
}

function readStoredRange(): { preset: Preset; custom: CustomRange | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as { preset?: unknown; custom?: Record<string, unknown> }
    const preset = PRESETS.find((p) => p.id === parsed.preset)?.id
    if (!preset) return null
    const c = parsed.custom
    let custom: CustomRange | null = null
    if (
      c &&
      isValidDate(c.desde) &&
      isValidDate(c.hasta) &&
      isValidTime(c.horaDesde) &&
      isValidTime(c.horaHasta) &&
      toLocalDateTimeValue(c.desde, c.horaDesde) <= toLocalDateTimeValue(c.hasta, c.horaHasta)
    ) {
      custom = { desde: c.desde, hasta: c.hasta, horaDesde: c.horaDesde, horaHasta: c.horaHasta }
    }
    // A stored custom preset without valid custom values falls back to Hoy
    if (preset === 'custom' && !custom) return { preset: 'hoy', custom: null }
    return { preset, custom }
  } catch {
    return null
  }
}

function writeStoredRange(preset: Preset, custom: CustomRange) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify({ preset, custom }))
  } catch {
    // Storage may be unavailable (private mode / quota); persistence is best-effort
  }
}

// Resolve the selected preset into absolute dates (evaluated at fetch time so "Hoy" rolls over at midnight)
function resolveRange(preset: Preset, custom: CustomRange): { inicio: Date; fin: Date } {
  const now = new Date()
  const day = (offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  if (preset === 'hoy') {
    const d = day(0)
    return { inicio: d, fin: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) }
  }
  if (preset === 'ayer') {
    const d = day(-1)
    return { inicio: d, fin: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) }
  }
  if (preset === '7d') {
    const start = day(-6)
    const end = day(0)
    return { inicio: start, fin: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59) }
  }
  return {
    inicio: new Date(`${custom.desde}T${custom.horaDesde || '00:00'}:00`),
    fin: new Date(`${custom.hasta}T${custom.horaHasta || '23:59'}:59`),
  }
}

function formatHora(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function formatFecha(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function clienteLabel(c: CompraCajaItem): { main: string; sub?: string } {
  if (c.jugador) return { main: `${c.jugador.nombre} ${c.jugador.apellido}`.trim() }
  if (c.dni_mascara) return { main: 'Sin la app', sub: `DNI ${c.dni_mascara}` }
  return { main: 'Sin DNI' }
}

function cobradoPor(c: CompraCajaItem): string | null {
  return (c as CompraConCobrador).creado_por?.nombre ?? null
}

interface MetricProps {
  icon: string
  label: string
  value: string
  tone: string
  toneBg: string
}

function Metric({ icon, label, value, tone, toneBg }: MetricProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${toneBg}`}>
          <span className={`material-symbols-outlined ${tone}`}>{icon}</span>
        </div>
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">{label}</h3>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold break-words ${tone === 'text-primary' ? 'text-slate-900 dark:text-white' : tone}`}>{value}</p>
    </div>
  )
}

function SaleBadges({ c }: { c: CompraCajaItem }) {
  return (
    <>
      {c.monto_descuento > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
          -{money(c.monto_descuento)}
          {c.cupon && <span className="text-slate-600 dark:text-slate-300">· {c.cupon.titulo}</span>}
        </span>
      )}
      {c.monto_descuento <= 0 && c.cupon && (
        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs font-medium">
          {c.cupon.titulo}
        </span>
      )}
      {c.puntos_acreditados > 0 && (
        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
          +{c.puntos_acreditados} pts
        </span>
      )}
    </>
  )
}

interface CajaHistorialProps {
  cantinaId?: string
  refreshKey?: number
  showCantina?: boolean
}

export default function CajaHistorial({ cantinaId, refreshKey = 0, showCantina = false }: CajaHistorialProps) {
  const [preset, setPreset] = useState<Preset>('hoy')
  const [custom, setCustom] = useState<CustomRange>(() => {
    const today = toDateStr(new Date())
    return { desde: today, hasta: today, horaDesde: '00:00', horaHasta: '23:59' }
  })
  // The stored range is read after mount (avoids hydration mismatches); nothing is written or fetched before that
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const stored = readStoredRange()
    if (stored) {
      setPreset(stored.preset)
      if (stored.custom) setCustom(stored.custom)
    }
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (hydrated) writeStoredRange(preset, custom)
  }, [hydrated, preset, custom])
  const [offset, setOffset] = useState(0)
  // Switching cantina keeps the range but goes back to the first page.
  const [prevCantinaId, setPrevCantinaId] = useState(cantinaId)
  if (prevCantinaId !== cantinaId) {
    setPrevCantinaId(cantinaId)
    setOffset(0)
  }
  const [data, setData] = useState<ListarComprasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const lastRefreshRef = useRef(refreshKey)

  const selectPreset = (next: Preset) => {
    setPreset(next)
    setOffset(0)
  }

  const updateDesde = (date = custom.desde, time = custom.horaDesde) => {
    setOffset(0)
    setCustom((prev) => {
      const next = { ...prev, desde: date, horaDesde: time }
      if (toLocalDateTimeValue(date, time) > toLocalDateTimeValue(prev.hasta, prev.horaHasta)) {
        next.hasta = date
        next.horaHasta = time
      }
      return next
    })
  }

  const updateHasta = (date = custom.hasta, time = custom.horaHasta) => {
    if (toLocalDateTimeValue(date, time) < toLocalDateTimeValue(custom.desde, custom.horaDesde)) return
    setOffset(0)
    setCustom((prev) => ({ ...prev, hasta: date, horaHasta: time }))
  }

  const load = useCallback(
    async (showLoader: boolean) => {
      const { inicio, fin } = resolveRange(preset, custom)
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return
      const days = (fin.getTime() - inicio.getTime()) / 86400000
      if (days > MAX_RANGE_DAYS) {
        setError(`El período no puede superar los ${MAX_RANGE_DAYS} días`)
        setLoading(false)
        return
      }
      const requestId = ++requestIdRef.current
      try {
        if (showLoader) setLoading(true)
        const res = await listarCompras({
          desde: inicio.toISOString(),
          hasta: fin.toISOString(),
          limit: PAGE_SIZE,
          offset,
          cantina_id: cantinaId,
        })
        if (requestId !== requestIdRef.current) return
        setData(res)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        // Keep the last good data on silent (polling) failures
        if (showLoader) {
          setData(null)
          setError(err instanceof Error ? err.message : 'No pudimos cargar las ventas')
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    [preset, custom, offset, cantinaId]
  )

  // Load on range/page change (or refreshKey bump, silently) + poll every 30s while visible
  useEffect(() => {
    if (!hydrated) return
    const silent = lastRefreshRef.current !== refreshKey
    lastRefreshRef.current = refreshKey
    load(!silent)
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') load(false)
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(false)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load, refreshKey, hydrated])

  const { inicio, fin } = resolveRange(preset, custom)
  const multiDay = toDateStr(inicio) !== toDateStr(fin)
  const totales = data?.totales
  const items = data?.items ?? []
  const totalCount = data?.total_count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const page = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 sm:p-5 space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
          Historial de caja
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Todas las ventas registradas, con o sin cupón y con o sin puntos.
        </p>
      </div>

      {/* Range filter */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p.id)}
              aria-pressed={preset === p.id}
              className={`min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${
                preset === p.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Desde</label>
              <DateTimePicker
                dateValue={custom.desde}
                timeValue={custom.horaDesde}
                onDateChange={(value) => updateDesde(value, custom.horaDesde)}
                onTimeChange={(value) => updateDesde(custom.desde, value)}
                placeholder="Inicio del período"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-xs font-medium mb-1.5">Hasta</label>
              <DateTimePicker
                dateValue={custom.hasta}
                timeValue={custom.horaHasta}
                onDateChange={(value) => updateHasta(value, custom.horaHasta)}
                onTimeChange={(value) => updateHasta(custom.hasta, value)}
                placeholder="Fin del período"
                minDateTime={toLocalDateTimeString(custom.desde, custom.horaDesde)}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        !error && totales && (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
              <Metric icon="shopping_cart" label="Ventas" value={String(totales.cantidad)} tone="text-indigo-400" toneBg="bg-indigo-500/10" />
              <Metric icon="payments" label="Total cobrado" value={money(totales.total_cobrado)} tone="text-green-400" toneBg="bg-green-500/10" />
              <Metric icon="sell" label="Descuentos" value={`-${money(totales.total_descuentos)}`} tone="text-red-400" toneBg="bg-red-500/10" />
              <Metric icon="stars" label="Puntos dados" value={String(totales.puntos_dados)} tone="text-amber-400" toneBg="bg-amber-500/10" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Ventas
              </h3>

              {items.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">receipt_long</span>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Todavía no hay ventas en este período</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <ul className="space-y-2 md:hidden">
                    {items.map((c) => {
                      const cli = clienteLabel(c)
                      return (
                        <li key={c.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {multiDay && `${formatFecha(c.created_at)} · `}{formatHora(c.created_at)}
                              </p>
                              <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{cli.main}</p>
                              {cli.sub && <p className="text-xs text-slate-500 dark:text-slate-400">{cli.sub}</p>}
                              {showCantina && <p className="text-xs font-medium text-primary">{c.cantina.nombre}</p>}
                              {cobradoPor(c) && <p className="text-xs text-slate-500 dark:text-slate-400">Cobrado por {cobradoPor(c)}</p>}
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white shrink-0">{money(c.monto_total)}</p>
                          </div>
                          {(c.monto_descuento > 0 || c.cupon || c.puntos_acreditados > 0) && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <SaleBadges c={c} />
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  {/* Desktop table */}
                  <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                          <th className="px-4 py-3 font-medium">{multiDay ? 'Fecha y hora' : 'Hora'}</th>
                          <th className="px-4 py-3 font-medium">Cliente</th>
                          <th className="px-4 py-3 font-medium">Detalle</th>
                          <th className="px-4 py-3 font-medium text-right">Total cobrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((c) => {
                          const cli = clienteLabel(c)
                          return (
                            <tr key={c.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {multiDay && `${formatFecha(c.created_at)} · `}{formatHora(c.created_at)}
                              </td>
                              <td className="px-4 py-3 text-slate-900 dark:text-white">
                                {cli.main}
                                {cli.sub && <span className="block text-xs text-slate-500 dark:text-slate-400">{cli.sub}</span>}
                                {showCantina && <span className="block text-xs font-medium text-primary">{c.cantina.nombre}</span>}
                                {cobradoPor(c) && <span className="block text-xs text-slate-500 dark:text-slate-400">Cobrado por {cobradoPor(c)}</span>}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <SaleBadges c={c} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                {money(c.monto_total)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {totalCount > PAGE_SIZE && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCount)} de {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                      disabled={page === 1}
                      className="min-h-11 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[3rem] text-center">
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                      disabled={page >= totalPages}
                      className="min-h-11 px-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      )}
    </section>
  )
}
