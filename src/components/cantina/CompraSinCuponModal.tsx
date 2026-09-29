'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getPuntosJugadorPorDni,
  registrarCompraPuntos,
  type PuntosConfigResponse,
  type PuntosJugadorResponse,
  type PuntosCompraResponse,
} from '@/lib/api'

// Accepts "1234", "1234.5" or "1234,50"; returns 0 when invalid
export function parseMonto(value: string): number {
  const n = parseFloat(value.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

// floor(monto * puntos / monto_base); 0 when the club has no active config
export function calcPuntos(monto: number, config: PuntosConfigResponse | null): number {
  if (!config || !config.activo || !config.monto_base || monto <= 0) return 0
  return Math.floor((monto * config.puntos) / config.monto_base)
}

interface Props {
  isOpen: boolean
  onClose: () => void
  config: PuntosConfigResponse | null
}

const inputClass =
  'w-full h-12 px-4 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-base placeholder:text-slate-400 focus:outline-none focus:border-primary'

export default function CompraSinCuponModal({ isOpen, onClose, config }: Props) {
  const [mounted, setMounted] = useState(false)
  const [monto, setMonto] = useState('')
  const [cargarPuntos, setCargarPuntos] = useState(true)
  const [dni, setDni] = useState('')
  const [jugador, setJugador] = useState<PuntosJugadorResponse | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PuntosCompraResponse | null>(null)
  const [sinPuntosDone, setSinPuntosDone] = useState(false)

  useEffect(() => setMounted(true), [])

  const puntosActivos = !!config && config.activo
  const montoNum = parseMonto(monto)
  const puntos = calcPuntos(montoNum, config)
  const puntosOn = puntosActivos && cargarPuntos

  const reset = () => {
    setMonto('')
    setCargarPuntos(true)
    setDni('')
    setJugador(null)
    setBuscando(false)
    setGuardando(false)
    setError('')
    setResult(null)
    setSinPuntosDone(false)
  }

  // Start clean every time the modal opens
  useEffect(() => {
    if (isOpen) reset()
  }, [isOpen])

  if (!mounted || !isOpen) return null

  const busy = buscando || guardando
  const handleClose = () => {
    if (!busy) onClose()
  }

  const handleBuscar = async () => {
    if (dni.length < 7) {
      setError('Ingresá un DNI de 7 a 9 dígitos')
      return
    }
    try {
      setBuscando(true)
      setError('')
      setJugador(null)
      setJugador(await getPuntosJugadorPorDni(dni))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo buscar al jugador')
    } finally {
      setBuscando(false)
    }
  }

  const handleConfirmar = async () => {
    if (!montoNum) {
      setError('Ingresá un monto válido')
      return
    }
    if (!puntosOn) {
      setSinPuntosDone(true)
      return
    }
    if (!jugador) {
      setError('Buscá al jugador por DNI antes de cargar los puntos')
      return
    }
    if (puntos <= 0) {
      setError('Con este monto no se suman puntos')
      return
    }
    try {
      setGuardando(true)
      setError('')
      setResult(await registrarCompraPuntos(dni, montoNum))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los puntos')
    } finally {
      setGuardando(false)
    }
  }

  const done = result !== null || sinPuntosDone

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">shopping_bag</span>
            Compra sin cupón
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            aria-label="Cerrar"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {done ? (
            <div className="text-center space-y-4 py-2">
              <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
              {result ? (
                <>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    +{result.puntos_acreditados} puntos
                  </p>
                  <p className="text-base text-slate-700 dark:text-slate-200">
                    a {result.jugador.nombre} {result.jugador.apellido}
                  </p>
                  <p className="text-base text-slate-500 dark:text-slate-400">
                    Saldo: {result.saldo} puntos
                  </p>
                </>
              ) : (
                <p className="text-base text-slate-700 dark:text-slate-200">Compra sin puntos</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-base font-medium transition-colors"
                >
                  Nueva compra
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-base font-medium mb-1.5">
                  Monto de la compra ($)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={monto}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^\d*[.,]?\d{0,2}$/.test(v)) {
                      setMonto(v)
                      setError('')
                    }
                  }}
                  placeholder="Ej: 5000"
                  disabled={busy}
                  className={`${inputClass} text-lg font-bold text-center border-slate-300 dark:border-slate-600`}
                />
                {puntosActivos && puntos > 0 && (
                  <p className="text-base font-medium text-primary mt-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xl">stars</span>
                    Suma {puntos} {puntos === 1 ? 'punto' : 'puntos'}
                  </p>
                )}
              </div>

              <label
                className={`flex items-center gap-3 text-base text-slate-800 dark:text-slate-100 ${puntosActivos ? 'cursor-pointer' : 'opacity-60'}`}
              >
                <input
                  type="checkbox"
                  checked={puntosOn}
                  disabled={!puntosActivos || busy}
                  onChange={(e) => {
                    setCargarPuntos(e.target.checked)
                    setError('')
                  }}
                  className="w-6 h-6 accent-primary"
                />
                Cargar puntos
              </label>
              {!puntosActivos && (
                <p className="text-base text-amber-600 dark:text-amber-400">El club no tiene puntos activos</p>
              )}

              {puntosOn && (
                <div className="space-y-3">
                  <label className="block text-slate-600 dark:text-slate-300 text-base font-medium">
                    DNI del jugador
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={dni}
                      onChange={(e) => {
                        setDni(e.target.value.replace(/\D/g, '').slice(0, 9))
                        setJugador(null)
                        setError('')
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                      placeholder="Sin puntos ni espacios"
                      disabled={busy}
                      className={`${inputClass} flex-1 min-w-0 border-slate-300 dark:border-slate-600`}
                    />
                    <button
                      type="button"
                      onClick={handleBuscar}
                      disabled={busy || dni.length < 7}
                      className="h-12 px-5 bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {buscando ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-xl">search</span>
                      )}
                      Buscar
                    </button>
                  </div>
                  {jugador && (
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-center">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {jugador.apellido}, {jugador.nombre}
                      </p>
                      <p className="text-base text-slate-500 dark:text-slate-400">
                        Saldo actual: {jugador.saldo} puntos
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-red-500 dark:text-red-400 text-base">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-base font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={busy || !montoNum || (puntosOn && (!jugador || puntos <= 0))}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Cargando...
                    </>
                  ) : puntosOn ? (
                    `Cargar ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}`
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
