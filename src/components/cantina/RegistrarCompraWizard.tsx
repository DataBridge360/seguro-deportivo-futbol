'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  buscarCupon,
  getPuntosJugadorPorDni,
  registrarCompra,
  type CuponResponse,
  type PuntosJugadorResponse,
  type RegistrarCompraData,
} from '@/lib/api'
import { useQrScanner } from './useQrScanner'
import { isCuponVencido } from '@/lib/cupones'

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
function calcDescuento(cupon: CuponResponse | null, base: number): number {
  if (!cupon || base <= 0) return 0
  if (cupon.tipo_descuento === 'porcentaje') return Math.round(((base * cupon.valor_descuento) / 100) * 100) / 100
  return Math.min(cupon.valor_descuento, base)
}

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
  const [cuponOn, setCuponOn] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState<CuponResponse | null>(null)
  const [cuponLoading, setCuponLoading] = useState(false)
  const [cuponError, setCuponError] = useState('')
  const [montoAplicable, setMontoAplicable] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RegistrarCompraData | null>(null)

  useEffect(() => setMounted(true), [])

  const montoNum = parseMonto(monto)
  const dniValido = dni.length >= 7 && dni.length <= 9
  const jugadorFound = lookup === 'found' && !!jugador
  const puedeSumarPuntos = puntosActivos && jugadorFound

  const searchCupon = async (raw: string) => {
    const value = raw.trim()
    if (!value) {
      setCuponError('Ingresá el código del cupón')
      return
    }
    setCuponLoading(true)
    setCuponError('')
    setCupon(null)
    setMontoAplicable('')
    try {
      setCupon(await buscarCupon(value))
    } catch (err) {
      setCuponError(err instanceof Error ? err.message : 'No pudimos buscar el cupón')
    } finally {
      setCuponLoading(false)
    }
  }

  const scanner = useQrScanner((value) => {
    const code = value.trim().toUpperCase()
    setCodigo(code)
    void searchCupon(code)
  })
  const stopScanner = scanner.stop

  const resetAll = () => {
    stopScanner()
    setStep('monto')
    setMonto('')
    setDni('')
    setSinDni(false)
    setLookup('idle')
    setJugador(null)
    setLookupMsg('')
    setCuponOn(false)
    setCodigo('')
    setCupon(null)
    setCuponLoading(false)
    setCuponError('')
    setMontoAplicable('')
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
      return
    }
    let cancelled = false
    setLookup('loading')
    const timer = setTimeout(async () => {
      try {
        const data = await getPuntosJugadorPorDni(dni)
        if (cancelled) return
        setJugador(data)
        setLookup('found')
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : ''
        setJugador(null)
        // Backend 404: "No encontramos un jugador con ese DNI en el club".
        if (/no encontra|not found|404|no existe/i.test(message)) {
          setLookup('notfound')
          setLookupMsg('')
        } else {
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

  // Coupon validity given the current amount / DNI
  const cuponProblem = useMemo(() => {
    if (!cupon) return ''
    if (cupon.usado) return 'Este cupón ya fue utilizado.'
    if (isCuponVencido(cupon)) return 'Este cupón está vencido.'
    if (cupon.monto_minimo_compra && montoNum < cupon.monto_minimo_compra) {
      return `Este cupón requiere una compra mínima de ${formatMoney(cupon.monto_minimo_compra)}.`
    }
    if (cupon.jugadores?.dni && !sinDni && dniValido && cupon.jugadores.dni !== dni) {
      return 'El cupón no pertenece a ese DNI.'
    }
    return ''
  }, [cupon, montoNum, dni, dniValido, sinDni])

  const cuponAplicado = cuponOn && !!cupon && !cuponProblem ? cupon : null
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
    stopScanner()
    onClose()
  }

  const goTo = (next: Step) => {
    stopScanner()
    setError('')
    setStep(next)
  }

  const toggleCupon = () => {
    if (cuponOn) {
      stopScanner()
      setCuponOn(false)
      setCodigo('')
      setCupon(null)
      setCuponError('')
      setMontoAplicable('')
    } else {
      setCuponOn(true)
    }
  }

  const extrasBlocked = cuponOn && (!cupon || !!cuponProblem || cuponLoading || !aplicableValid)

  const handleSubmit = async () => {
    if (!montoNum) {
      setError('Ingresá un monto válido')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      const data = await registrarCompra({
        monto_compra: montoNum,
        ...(!sinDni && dniValido ? { dni } : {}),
        ...(cuponAplicado?.codigo ? { cupon_codigo: cuponAplicado.codigo, monto_aplicable: aplicableNum } : {}),
      })
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
                onChange={(e) => {
                  setDni(e.target.value.replace(/\D/g, '').slice(0, 9))
                  setSinDni(false)
                }}
                placeholder="DNI (sin puntos ni espacios)"
                className={`${inputClass} text-center text-lg`}
              />

              {lookup === 'loading' && (
                <div className="flex items-center justify-center gap-2 text-base text-slate-500 dark:text-slate-400">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </div>
              )}
              {lookup === 'found' && jugador && (
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
              {lookup === 'notfound' && (
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

              <button
                type="button"
                onClick={() => {
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
              <p className="text-slate-700 dark:text-slate-200 text-lg font-semibold text-center">Extras (opcionales)</p>

              {/* Coupon card */}
              <div
                className={`rounded-xl border-2 transition-colors ${
                  cuponOn ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={cuponOn}
                  onClick={toggleCupon}
                  className="w-full min-h-[72px] px-4 flex items-center gap-3 text-left"
                >
                  <span className="material-symbols-outlined text-3xl text-primary">confirmation_number</span>
                  <span className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
                    Agregar cupón de descuento
                  </span>
                  <span className="material-symbols-outlined text-3xl text-primary">
                    {cuponOn ? 'toggle_on' : 'toggle_off'}
                  </span>
                </button>

                {cuponOn && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigo}
                        onChange={(e) => {
                          setCodigo(e.target.value.toUpperCase())
                          setCupon(null)
                          setCuponError('')
                          setMontoAplicable('')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && searchCupon(codigo)}
                        placeholder="Ej: CUP-ABC123"
                        className={`${inputClass} flex-1 min-w-0 font-mono`}
                      />
                      <button
                        type="button"
                        onClick={() => searchCupon(codigo)}
                        disabled={cuponLoading || !codigo.trim()}
                        aria-label="Buscar cupón"
                        className="w-12 h-12 shrink-0 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {cuponLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-2xl">search</span>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => (scanner.active ? stopScanner() : void scanner.start())}
                      className="w-full min-h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {scanner.active ? 'close' : 'qr_code_scanner'}
                      </span>
                      {scanner.active ? 'Cerrar cámara' : 'Escanear QR'}
                    </button>

                    {scanner.active && (
                      <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
                        <video ref={scanner.videoRef} className="w-full h-full object-cover" playsInline muted />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-40 h-40 border-4 border-primary/80 rounded-xl" />
                        </div>
                      </div>
                    )}
                    {scanner.error && <p className="text-base text-red-500 dark:text-red-400">{scanner.error}</p>}
                    {cuponError && <p className="text-base text-red-500 dark:text-red-400">{cuponError}</p>}

                    {cupon && (
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-3 space-y-1">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{cupon.titulo}</p>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                          {cupon.tipo_descuento === 'porcentaje'
                            ? `${cupon.valor_descuento}% de descuento`
                            : `${formatMoney(cupon.valor_descuento)} de descuento`}
                        </p>
                        {cuponProblem ? (
                          <p className="text-base text-red-500 dark:text-red-400">{cuponProblem}</p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            <label htmlFor="rc-aplicable" className="block text-base font-semibold text-slate-900 dark:text-white">
                              ¿Sobre cuánto se aplica el descuento?
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Ingresá el precio de los productos del cupón «{cupon.titulo}» (ej. solo las hamburguesas)
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
              </div>
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
