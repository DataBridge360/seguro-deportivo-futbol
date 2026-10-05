'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getPuntosJugadorPorDni,
  registrarCompra,
  type CouponColor,
  type PuntosJugadorResponse,
  type RegistrarCompraData,
} from '@/lib/api'
import {
  getCuponesDisponibles,
  normalizarDni,
  registrarCompraConCuponId,
  type CuponDisponible,
} from '@/lib/cuponesCaja'
import { formatCuponVigencia, isCuponVencido } from '@/lib/cupones'

type Step = 'monto' | 'cliente' | 'extras' | 'confirmar' | 'resultado'
type Lookup = 'idle' | 'loading' | 'found' | 'notfound' | 'error'

const FORM_STEPS: { key: Exclude<Step, 'resultado'>; label: string }[] = [
  { key: 'monto', label: 'Monto' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'extras', label: 'Extras' },
  { key: 'confirmar', label: 'Confirmar' },
]

const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const formatMoney = (n: number) => moneyFmt.format(n)

// Accepts "1234", "1234.5" or "1234,50"; returns 0 when invalid
function parseMonto(value: string): number {
  const n = parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

// The discount is computed over the amount the coupon applies to (base), not the whole purchase
function calcDescuento(cupon: Pick<CuponDisponible, 'tipo_descuento' | 'valor_descuento'> | null, base: number): number {
  if (!cupon || base <= 0) return 0
  if (cupon.tipo_descuento === 'porcentaje') return Math.round(((base * cupon.valor_descuento) / 100) * 100) / 100
  return Math.min(cupon.valor_descuento, base)
}

const descuentoLabel = (c: Pick<CuponDisponible, 'tipo_descuento' | 'valor_descuento'>) =>
  c.tipo_descuento === 'porcentaje' ? `${c.valor_descuento}%` : formatMoney(c.valor_descuento)

const cuponAccent: Record<CouponColor, { bar: string; badge: string }> = {
  amber: { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  blue: { bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  green: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  red: { bar: 'bg-red-500', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
  purple: { bar: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' },
}
const accentFor = (color: string | null) => cuponAccent[(color as CouponColor) ?? 'amber'] ?? cuponAccent.amber

interface Props {
  isOpen: boolean
  onClose: () => void
  // True when the club has points enabled (never expose the conversion rate)
  puntosActivos: boolean
  // Called after a purchase was registered so the page can refresh its data
  onCompleted?: () => void
}

const primaryBtn =
  'flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
const secondaryBtn =
  'h-12 px-5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-base font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1'
const inputClass =
  'w-full h-12 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-base placeholder:text-slate-400 focus:outline-none focus:border-primary'

export default function RegistrarCompraWizard({ isOpen, onClose, puntosActivos, onCompleted }: Props) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>('monto')
  const [monto, setMonto] = useState('')
  const [dni, setDni] = useState('')
  const [sinDni, setSinDni] = useState(false)
  const [lookup, setLookup] = useState<Lookup>('idle')
  const [jugador, setJugador] = useState<PuntosJugadorResponse | null>(null)
  const [lookupMsg, setLookupMsg] = useState('')
  // DNI the last conclusive lookup answered for; guards against a result that belongs to an older DNI
  const [lookupDni, setLookupDni] = useState('')
  const [disponibles, setDisponibles] = useState<CuponDisponible[]>([])
  const [dispLoading, setDispLoading] = useState(false)
  const [dispError, setDispError] = useState('')
  const [dispReload, setDispReload] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [montoAplicable, setMontoAplicable] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RegistrarCompraData | null>(null)

  useEffect(() => setMounted(true), [])

  const montoNum = parseMonto(monto)
  const dniValido = dni.length >= 7 && dni.length <= 9
  const lookupActual = lookupDni === dni
  const jugadorFound = lookup === 'found' && !!jugador && lookupActual
  const dniNoRegistrado = lookup === 'notfound' && lookupActual
  const puedeSumarPuntos = puntosActivos && jugadorFound

  const clearCupon = () => {
    setSelectedId(null)
    setMontoAplicable('')
  }

  const resetAll = () => {
    setStep('monto')
    setMonto('')
    setDni('')
    setSinDni(false)
    setLookup('idle')
    setJugador(null)
    setLookupMsg('')
    setLookupDni('')
    setDisponibles([])
    setDispLoading(false)
    setDispError('')
    clearCupon()
    setSubmitting(false)
    setError('')
    setResult(null)
  }

  // Start clean every time the wizard opens
  useEffect(() => {
    if (isOpen) resetAll()
  }, [isOpen])

  // Live DNI lookup (debounced)
  useEffect(() => {
    if (sinDni || dni.length < 7) {
      setLookup('idle')
      setJugador(null)
      setLookupMsg('')
      setLookupDni('')
      return
    }
    let cancelled = false
    setLookup('loading')
    const timer = setTimeout(async () => {
      try {
        const data = await getPuntosJugadorPorDni(dni)
        if (cancelled) return
        setJugador(data)
        setLookupDni(dni)
        setLookup('found')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : ''
        setJugador(null)
        // Backend 404: "No encontramos un jugador con ese DNI en el club".
        if (/no encontra|not found|404|no existe/i.test(message)) {
          setLookupDni(dni)
          setLookup('notfound')
          setLookupMsg('')
        } else {
          setLookupDni('')
          setLookup('error')
          setLookupMsg(message || 'No pudimos buscar el DNI')
        }
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [dni, sinDni])

  // Players' coupons are fetched only once the lookup resolved for the current DNI.
  // The cleanup flag drops responses that arrive after the DNI changed.
  const dniResuelto = jugadorFound ? dni : ''
  useEffect(() => {
    setSelectedId(null)
    setDisponibles([])
    setDispError('')
    if (!dniResuelto) {
      setDispLoading(false)
      return
    }
    let cancelled = false
    setDispLoading(true)
    getCuponesDisponibles(dniResuelto)
      .then((data) => {
        if (!cancelled) setDisponibles(data.cupones)
      })
      .catch((err) => {
        if (!cancelled) setDispError(err instanceof Error ? err.message : 'No pudimos buscar los cupones')
      })
      .finally(() => {
        if (!cancelled) setDispLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [dniResuelto, dispReload])

  const cuponActivo = disponibles.find((c) => c.id === selectedId) ?? null

  // Coupon validity given the current amount
  const cuponProblem = useMemo(() => {
    if (!cuponActivo) return ''
    if (cuponActivo.monto_minimo_compra && montoNum < cuponActivo.monto_minimo_compra) {
      return `Este cupón requiere una compra mínima de ${formatMoney(cuponActivo.monto_minimo_compra)}.`
    }
    return isCuponVencido({ usado: false, valido_desde: null, ...cuponActivo }) ? 'Este cupón está vencido.' : ''
  }, [cuponActivo, montoNum])

  const cuponAplicado = cuponActivo && !cuponProblem ? cuponActivo : null
  const aplicableNum = parseMonto(montoAplicable)
  const aplicableValid = aplicableNum > 0 && aplicableNum <= montoNum
  const aplicableError =
    montoAplicable && aplicableNum <= 0
      ? 'Ingresá un monto mayor a cero'
      : aplicableNum > montoNum
        ? `No puede superar el monto de la compra (${formatMoney(montoNum)})`
        : ''
  const descuento = calcDescuento(cuponAplicado, aplicableValid ? aplicableNum : 0)
  const total = Math.max(0, Math.round((montoNum - descuento) * 100) / 100)
  // Points are automatic: credited whenever the DNI is a registered player.
  const puntosFinal = puedeSumarPuntos

  if (!mounted || !isOpen) return null

  const stepIndex = FORM_STEPS.findIndex((s) => s.key === step)

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const goTo = (next: Step) => {
    setError('')
    setStep(next)
  }

  // Tap to select, tap again to deselect. A new pick resets the amount the discount applies to.
  const toggleCuponLista = (id: string) => {
    setMontoAplicable('')
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const handleDniChange = (value: string) => {
    const next = normalizarDni(value).slice(0, 9)
    // Typing a dot or space leaves the same digits: keep the current coupons
    if (next === dni) return
    clearCupon()
    setDisponibles([])
    setDni(next)
    setSinDni(false)
  }

  const extrasBlocked = !!cuponActivo && (!!cuponProblem || !aplicableValid)

  const handleSubmit = async () => {
    if (!montoNum) {
      setError('Ingresá un monto válido')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      const body = {
        monto_compra: montoNum,
        ...(!sinDni && dniValido ? { dni } : {}),
      }
      const data = cuponAplicado
        ? await registrarCompraConCuponId({ ...body, cupon_id: cuponAplicado.id, monto_aplicable: aplicableNum })
        : await registrarCompra(body)
      setResult(data)
      setStep('resultado')
      onCompleted?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar la compra')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext =
    step === 'monto'
      ? montoNum > 0
      : step === 'cliente'
        ? sinDni || (dniValido && lookup !== 'loading')
        : step === 'extras'
          ? !extrasBlocked
          : true

  const handleNext = () => {
    if (step === 'monto') goTo('cliente')
    else if (step === 'cliente') goTo('extras')
    else if (step === 'extras') goTo('confirmar')
    else if (step === 'confirmar') void handleSubmit()
  }

  const handleBack = () => {
    if (step === 'cliente') goTo('monto')
    else if (step === 'extras') goTo('cliente')
    else if (step === 'confirmar') goTo('extras')
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">point_of_sale</span>
            Registrar compra
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'resultado' && (
          <div className="px-5 pt-4 flex items-center gap-2" aria-label={`Paso ${stepIndex + 1} de ${FORM_STEPS.length}`}>
            {FORM_STEPS.map((s, i) => (
              <div key={s.key} className="flex-1 min-w-0">
                <div className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <p
                  className={`mt-1.5 text-xs font-medium truncate ${i === stepIndex ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {step === 'monto' && (
            <div className="space-y-3">
              <label htmlFor="rc-monto" className="block text-slate-700 dark:text-slate-200 text-lg font-semibold text-center">
                ¿Cuánto es la compra?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-400">$</span>
                <input
                  id="rc-monto"
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={monto}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^\d*[.,]?\d{0,2}$/.test(v)) setMonto(v)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && canNext && handleNext()}
                  placeholder="0"
                  className="w-full h-20 pl-12 pr-4 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-4xl font-bold text-center placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-center text-base text-slate-500 dark:text-slate-400 min-h-6">
                {montoNum > 0 ? formatMoney(montoNum) : 'Ingresá el total de la venta'}
              </p>
            </div>
          )}

          {step === 'cliente' && (
            <div className="space-y-4">
              <label htmlFor="rc-dni" className="block text-slate-700 dark:text-slate-200 text-lg font-semibold text-center">
                ¿Quién compra?
              </label>
              <input
                id="rc-dni"
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => handleDniChange(e.target.value)}
                placeholder="DNI (sin puntos ni espacios)"
                className={`${inputClass} text-center text-lg`}
              />

              {lookup === 'loading' && (
                <div className="flex items-center justify-center gap-2 text-base text-slate-500 dark:text-slate-400">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </div>
              )}
              {jugadorFound && jugador && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">verified</span>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {jugador.apellido}, {jugador.nombre}
                  </p>
                  {puntosActivos && (
                    <p className="text-base text-slate-600 dark:text-slate-300">Saldo: {jugador.saldo} puntos</p>
                  )}
                </div>
              )}
              {dniNoRegistrado && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
                  <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">info</span>
                  <p className="text-base text-amber-800 dark:text-amber-200">
                    Este DNI no está registrado. Para sumar puntos tiene que descargar la app de Club Plaza y registrarse.
                    Igual podés seguir: la compra queda registrada sin puntos.
                  </p>
                </div>
              )}
              {lookup === 'error' && (
                <p className="text-base text-red-500 dark:text-red-400 text-center">{lookupMsg}</p>
              )}

              {jugadorFound && (
                <div className="space-y-2">
                  <p className="text-base font-semibold text-slate-700 dark:text-slate-200">Cupones disponibles</p>
                  {dispLoading && (
                    <div className="flex items-center gap-2 text-base text-slate-500 dark:text-slate-400">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Buscando cupones...
                    </div>
                  )}
                  {dispError && (
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-base text-red-500 dark:text-red-400">{dispError}</p>
                      <button
                        type="button"
                        onClick={() => setDispReload((n) => n + 1)}
                        className="min-h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-base font-medium text-slate-700 dark:text-slate-200"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  {!dispLoading && !dispError && disponibles.length === 0 && (
                    <p className="text-base text-slate-500 dark:text-slate-400">No tiene cupones disponibles</p>
                  )}
                  {disponibles.map((c) => {
                    const accent = accentFor(c.color)
                    const selected = c.id === selectedId
                    const bajoMinimo = !!c.monto_minimo_compra && montoNum < c.monto_minimo_compra
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={bajoMinimo}
                        onClick={() => toggleCuponLista(c.id)}
                        className={`relative w-full min-h-[72px] pl-5 pr-4 py-3 rounded-xl border-2 text-left flex items-center gap-3 overflow-hidden transition-colors disabled:opacity-50 ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className={`absolute left-0 inset-y-0 w-2 ${accent.bar}`} aria-hidden />
                        <span className="flex-1 min-w-0">
                          <span className="block text-base font-semibold text-slate-900 dark:text-white">{c.titulo}</span>
                          <span className="block text-base text-slate-500 dark:text-slate-400">
                            {c.monto_minimo_compra ? `Compra mínima ${formatMoney(c.monto_minimo_compra)} · ` : ''}
                            {formatCuponVigencia({ ...c, valido_desde: null })}
                          </span>
                          {bajoMinimo && (
                            <span className="block text-base text-amber-600 dark:text-amber-400">
                              La compra no llega al mínimo
                            </span>
                          )}
                        </span>
                        <span className={`shrink-0 rounded-lg px-3 py-1.5 text-lg font-bold ${accent.badge}`}>
                          {descuentoLabel(c)}
                        </span>
                        {selected && (
                          <span className="material-symbols-outlined text-3xl text-primary shrink-0">check_circle</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  clearCupon()
                  setSinDni(true)
                  setDni('')
                }}
                className={`w-full min-h-12 px-4 rounded-xl border-2 text-base font-medium transition-colors flex items-center justify-center gap-2 ${
                  sinDni
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">
                  {sinDni ? 'check_circle' : 'no_accounts'}
                </span>
                No tiene la app / sin DNI
              </button>
              {sinDni && (
                <p className="text-base text-slate-500 dark:text-slate-400 text-center">
                  La compra se registra igual, sin puntos.
                </p>
              )}
            </div>
          )}

          {step === 'extras' && (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold text-center">Cupón (opcional)</p>

              {!cuponActivo && (
                <p className="text-base text-slate-500 dark:text-slate-400 text-center">
                  {jugadorFound
                    ? 'No elegiste ningún cupón. Volvé para tocar uno de los del jugador.'
                    : 'Sin cupón en esta compra.'}
                </p>
              )}

              {cuponActivo && (
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{cuponActivo.titulo}</p>
                      <p className="text-base text-slate-600 dark:text-slate-300">
                        {descuentoLabel(cuponActivo)} de descuento
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearCupon}
                      aria-label="Quitar cupón"
                      className="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                  </div>
                  {cuponProblem ? (
                    <p className="text-base text-red-500 dark:text-red-400">{cuponProblem}</p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <label htmlFor="rc-aplicable" className="block text-base font-semibold text-slate-900 dark:text-white">
                        ¿Sobre cuánto se aplica el descuento?
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Ingresá el precio de los productos del cupón «{cuponActivo.titulo}» (ej. solo las hamburguesas)
                      </p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                        <input
                          id="rc-aplicable"
                          type="text"
                          inputMode="decimal"
                          value={montoAplicable}
                          onChange={(e) => {
                            const v = e.target.value
                            if (/^\d*[.,]?\d{0,2}$/.test(v)) setMontoAplicable(v)
                          }}
                          aria-invalid={!!aplicableError}
                          placeholder="0"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                      {aplicableError && <p className="text-sm text-red-500 dark:text-red-400">{aplicableError}</p>}
                      {aplicableValid && (
                        <>
                          <p className="text-base text-green-600 dark:text-green-400">
                            Descuento: -{formatMoney(descuento)}
                          </p>
                          <p className="text-base font-bold text-slate-900 dark:text-white">
                            Total a cobrar: {formatMoney(total)}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'confirmar' && (
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold text-center">Revisá la compra</p>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-base">
                  <span className="text-slate-500 dark:text-slate-400">Monto</span>
                  <span className="text-slate-900 dark:text-white">{formatMoney(montoNum)}</span>
                </div>
                {cuponAplicado && (
                  <div className="flex justify-between gap-3 text-base">
                    <span className="text-slate-500 dark:text-slate-400">Descuento ({cuponAplicado.titulo}) sobre {formatMoney(aplicableNum)}</span>
                    <span className="text-green-600 dark:text-green-400 font-medium shrink-0">
                      -{formatMoney(descuento)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                  <span className="text-slate-900 dark:text-white font-bold text-base">Total a cobrar</span>
                  <span className="text-slate-900 dark:text-white font-bold text-2xl">{formatMoney(total)}</span>
                </div>
              </div>
              <div className="space-y-2 text-base">
                <p className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-slate-400">person</span>
                  {jugadorFound && jugador
                    ? `${jugador.apellido}, ${jugador.nombre}`
                    : !sinDni && dniValido
                      ? `DNI ${dni} (sin registrar en la app)`
                      : 'Sin DNI'}
                </p>
                {puntosFinal && (
                  <p className="text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl text-slate-400">stars</span>
                    Suma puntos
                  </p>
                )}
              </div>
              {error && <p className="text-base text-red-500 dark:text-red-400">{error}</p>}
            </div>
          )}

          {step === 'resultado' && result && (
            <div className="text-center space-y-4 py-2">
              <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">Compra registrada</p>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total cobrado</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {formatMoney(Number(result.monto_total))}
                </p>
              </div>
              {result.cupon && (
                <p className="text-base text-slate-700 dark:text-slate-200">
                  Cupón aplicado: {result.cupon.titulo} (-{formatMoney(Number(result.monto_descuento))})
                </p>
              )}
              {result.jugador_encontrado && result.jugador && (
                <p className="text-base text-slate-700 dark:text-slate-200">
                  {result.jugador.nombre} {result.jugador.apellido}
                  {result.puntos_acreditados > 0
                    ? `: +${result.puntos_acreditados} ${result.puntos_acreditados === 1 ? 'punto' : 'puntos'}`
                    : ': sin puntos en esta compra'}
                </p>
              )}
              {!result.jugador_encontrado && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-left flex gap-3">
                  <span className="material-symbols-outlined text-2xl text-amber-600 dark:text-amber-400">
                    smartphone
                  </span>
                  <p className="text-base text-amber-800 dark:text-amber-200">
                    {!sinDni && dniValido
                      ? 'Este DNI no está registrado, así que no suma puntos. '
                      : 'Esta compra no suma puntos. '}
                    Para empezar a sumar, la persona tiene que descargar la app de Club Plaza y registrarse.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          {step === 'resultado' ? (
            <>
              <button type="button" onClick={onClose} className={secondaryBtn}>
                Cerrar
              </button>
              <button type="button" onClick={resetAll} className={primaryBtn}>
                <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                Nueva compra
              </button>
            </>
          ) : (
            <>
              {step !== 'monto' && (
                <button type="button" onClick={handleBack} disabled={submitting} className={secondaryBtn}>
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                  Volver
                </button>
              )}
              <button type="button" onClick={handleNext} disabled={!canNext || submitting} className={primaryBtn}>
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Registrando...
                  </>
                ) : step === 'confirmar' ? (
                  <>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Registrar compra
                  </>
                ) : (
                  <>
                    Siguiente
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
