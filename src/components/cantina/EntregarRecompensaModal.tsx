'use client'

import { useEffect, useState } from 'react'
import SafeImage from '@/components/ui/SafeImage'
import {
  anularPuntosCanje,
  entregarPuntosCanje,
  getCanjePorCodigo,
  type CanjePorCodigo,
} from '@/lib/api'
import { getCanjesPorDni, type CanjesPorDniData } from '@/lib/canjesCaja'
import { normalizarDni } from '@/lib/cuponesCaja'
import {
  ConfirmModal,
  EmptyState,
  ErrorNote,
  Modal,
  Spinner,
  errMsg,
  fmt,
  formatDateTime,
  inputCls,
  labelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from '@/components/club/puntos/ui'
import { useQrScanner } from './useQrScanner'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type Confirm = 'entregar' | 'anular' | null
type Done = { kind: 'entregado' } | { kind: 'anulado'; devueltos: number } | null

// Accepts the code with or without the "RC-" prefix
function normalizeCodigo(raw: string): string {
  const s = raw.toUpperCase().replace(/\s+/g, '')
  if (!s) return ''
  return s.startsWith('RC-') ? s : `RC-${s}`
}

export default function EntregarRecompensaModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null
  return <Inner onClose={onClose} />
}

type Lookup = 'idle' | 'loading' | 'ok' | 'error'

function Inner({ onClose }: { onClose: () => void }) {
  const [dni, setDni] = useState('')
  const [lookup, setLookup] = useState<Lookup>('idle')
  const [lookupError, setLookupError] = useState('')
  const [data, setData] = useState<CanjesPorDniData | null>(null)
  const [reload, setReload] = useState(0)
  const [codigoOpen, setCodigoOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [canje, setCanje] = useState<CanjePorCodigo | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [done, setDone] = useState<Done>(null)

  // Live lookup of the player's pending canjes (debounced). The cleanup flag drops
  // responses that arrive after the DNI changed.
  useEffect(() => {
    if (dni.length < 7) {
      setLookup('idle')
      setLookupError('')
      setData(null)
      return
    }
    let cancelled = false
    setLookup('loading')
    setLookupError('')
    const timer = setTimeout(() => {
      getCanjesPorDni(dni)
        .then(res => {
          if (cancelled) return
          setData(res)
          setLookup('ok')
        })
        .catch(e => {
          if (cancelled) return
          setData(null)
          setLookup('error')
          setLookupError(errMsg(e, 'No pudimos buscar las recompensas'))
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [dni, reload])

  const handleDniChange = (value: string) => {
    const next = normalizarDni(value).slice(0, 9)
    // Typing a dot or space leaves the same digits: keep the current list
    if (next === dni) return
    setData(null)
    setDni(next)
  }

  const buscar = async (raw: string) => {
    const value = normalizeCodigo(raw)
    if (!value) {
      setError('Ingresá el código de la recompensa')
      return
    }
    setCodigo(value)
    setLoading(true)
    setError('')
    try {
      setCanje(await getCanjePorCodigo(value))
    } catch (e) {
      setCanje(null)
      setError(errMsg(e, 'No pudimos buscar el código'))
    } finally {
      setLoading(false)
    }
  }

  const scanner = useQrScanner(value => {
    void buscar(value)
  })

  const reset = () => {
    scanner.stop()
    setCodigo('')
    setCodigoOpen(false)
    setCanje(null)
    setError('')
    setConfirmError('')
    setConfirm(null)
    setDone(null)
  }

  const close = () => {
    scanner.stop()
    onClose()
  }

  const nombre = canje?.jugador ? `${canje.jugador.apellido}, ${canje.jugador.nombre}` : 'el jugador'

  const doEntregar = async () => {
    if (!canje) return
    setBusy(true)
    setConfirmError('')
    try {
      await entregarPuntosCanje(canje.id)
      setConfirm(null)
      setDone({ kind: 'entregado' })
      setData(null)
      setReload(n => n + 1)
    } catch (e) {
      setConfirmError(errMsg(e, 'No pudimos entregar la recompensa'))
    } finally {
      setBusy(false)
    }
  }

  const doAnular = async () => {
    if (!canje) return
    setBusy(true)
    setConfirmError('')
    try {
      const res = await anularPuntosCanje(canje.id)
      setConfirm(null)
      setDone({ kind: 'anulado', devueltos: res.puntos_devueltos })
      setData(null)
      setReload(n => n + 1)
    } catch (e) {
      setConfirmError(errMsg(e, 'No pudimos anular el canje'))
    } finally {
      setBusy(false)
    }
  }

  const openConfirm = (c: Exclude<Confirm, null>) => {
    setConfirmError('')
    setConfirm(c)
  }

  return (
    <>
      <Modal title="Recompensas" onClose={close} busy={busy || loading} suspended={confirm !== null}>
        {done ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span
              className={`material-symbols-outlined animate-bounce text-7xl ${
                done.kind === 'entregado' ? 'text-emerald-500' : 'text-amber-500'
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {done.kind === 'entregado' ? 'check_circle' : 'undo'}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {done.kind === 'entregado' ? 'Recompensa entregada' : 'Canje anulado'}
            </h3>
            {done.kind === 'anulado' && (
              <p className="text-base text-slate-700 dark:text-slate-200">
                Le devolvimos {fmt(done.devueltos)} puntos a {nombre}.
              </p>
            )}
            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
              <button type="button" onClick={reset} className={`${primaryBtnCls} flex-1`}>
                Ver recompensas
              </button>
              <button type="button" onClick={close} className={`${secondaryBtnCls} flex-1`}>
                Cerrar
              </button>
            </div>
          </div>
        ) : canje ? (
          <>
            <div className="flex gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
                <SafeImage
                  src={canje.recompensa?.imagen_url}
                  icon="redeem"
                  iconClassName="text-5xl"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="break-words text-lg font-bold text-slate-900 dark:text-white">
                  {canje.recompensa?.titulo ?? 'Recompensa'}
                </h3>
                <p className="text-base text-slate-700 dark:text-slate-200">
                  Canjeado por {fmt(canje.costo_puntos)} puntos
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(canje.created_at)}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {canje.jugador ? `${canje.jugador.apellido}, ${canje.jugador.nombre}` : 'Jugador'}
              </p>
              {canje.jugador?.dni && (
                <p className="text-sm text-slate-500 dark:text-slate-400">DNI: {canje.jugador.dni}</p>
              )}
              <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">{canje.codigo}</p>
            </div>

            {canje.estado === 'pendiente' && (
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                  Pendiente de entrega
                </span>
                <button type="button" onClick={() => openConfirm('entregar')} className={primaryBtnCls}>
                  <span className="material-symbols-outlined">redeem</span>
                  Entregar
                </button>
                <button
                  type="button"
                  onClick={() => openConfirm('anular')}
                  className="min-h-11 text-base font-semibold text-red-600 hover:underline dark:text-red-400"
                >
                  Anular y devolver puntos
                </button>
              </div>
            )}

            {canje.estado === 'entregado' && (
              <p className="rounded-xl bg-amber-50 p-3 text-base font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                Esta recompensa ya fue entregada
                {canje.entregado_at ? ` el ${formatDateTime(canje.entregado_at)}` : ''}
              </p>
            )}

            {canje.estado === 'anulado' && (
              <p className="rounded-xl bg-red-50 p-3 text-base font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                Este canje fue anulado
              </p>
            )}

            <button type="button" onClick={reset} className={secondaryBtnCls}>
              Volver
            </button>
          </>
        ) : (
          <>
            {scanner.active ? (
              <div className="space-y-3">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
                  <video ref={scanner.videoRef} className="size-full object-cover" playsInline muted />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                      <Spinner />
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Apuntá la cámara al QR de la recompensa
                </p>
                <button type="button" onClick={scanner.stop} className={`${secondaryBtnCls} w-full`}>
                  Escribir código
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="dni-recompensa" className="block text-center text-lg font-semibold text-slate-700 dark:text-slate-200">
                    ¿Quién retira?
                  </label>
                  <input
                    id="dni-recompensa"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={dni}
                    onChange={e => handleDniChange(e.target.value)}
                    placeholder="DNI (sin puntos ni espacios)"
                    className={`${inputCls} text-center text-lg`}
                  />
                </div>

                {lookup === 'loading' && (
                  <div className="flex items-center justify-center gap-2 text-base text-slate-500 dark:text-slate-400">
                    <Spinner />
                    Buscando...
                  </div>
                )}
                <ErrorNote message={lookupError} />

                {lookup === 'ok' && data && (
                  <div className="space-y-3">
                    <p className="text-center text-lg font-semibold text-slate-900 dark:text-white">
                      {data.jugador.apellido}, {data.jugador.nombre}
                    </p>
                    {data.canjes.length === 0 ? (
                      <EmptyState icon="redeem" title="No tiene recompensas para entregar" />
                    ) : (
                      <ul className="space-y-3">
                        {data.canjes.map(c => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setCanje(c)}
                              className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left transition-colors hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                            >
                              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
                                <SafeImage
                                  src={c.recompensa?.imagen_url}
                                  icon="redeem"
                                  iconClassName="text-4xl"
                                  className="size-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="break-words text-lg font-bold text-slate-900 dark:text-white">
                                  {c.recompensa?.titulo ?? 'Recompensa'}
                                </p>
                                <p className="text-base text-slate-700 dark:text-slate-200">
                                  {fmt(c.costo_puntos)} puntos
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {formatDateTime(c.created_at)}
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-slate-400" aria-hidden>
                                chevron_right
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  {codigoOpen ? (
                    <form
                      className="space-y-3"
                      onSubmit={e => {
                        e.preventDefault()
                        void buscar(codigo)
                      }}
                    >
                      <label htmlFor="codigo-recompensa" className={labelCls}>
                        Código de la recompensa
                      </label>
                      <input
                        id="codigo-recompensa"
                        type="text"
                        value={codigo}
                        autoComplete="off"
                        autoCapitalize="characters"
                        placeholder="RC-XXXXXX"
                        onChange={e => {
                          setCodigo(e.target.value.toUpperCase().replace(/\s+/g, ''))
                          setError('')
                        }}
                        className={`${inputCls} font-mono`}
                      />
                      <button type="submit" disabled={loading} className={`${primaryBtnCls} w-full`}>
                        {loading ? <Spinner /> : <span className="material-symbols-outlined">search</span>}
                        Buscar
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          setError('')
                          void scanner.start()
                        }}
                        className={`${secondaryBtnCls} w-full`}
                      >
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                        Escanear QR
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCodigoOpen(true)}
                      className="min-h-11 w-full text-base font-semibold text-primary hover:underline"
                    >
                      ¿Tiene un código?
                    </button>
                  )}
                </div>
              </>
            )}
            <ErrorNote message={error || scanner.error} />
          </>
        )}
      </Modal>

      {confirm === 'entregar' && canje && (
        <Modal
          title="Confirmar entrega"
          onClose={() => setConfirm(null)}
          busy={busy}
          footer={
            <>
              <button type="button" onClick={() => setConfirm(null)} disabled={busy} className={secondaryBtnCls}>
                Cancelar
              </button>
              <button type="button" onClick={doEntregar} disabled={busy} className={primaryBtnCls}>
                {busy && <Spinner />}
                Sí, entregar
              </button>
            </>
          }
        >
          <p className="text-base text-slate-700 dark:text-slate-200">
            ¿Entregás “{canje.recompensa?.titulo ?? 'la recompensa'}” a {nombre}?
          </p>
          <ErrorNote message={confirmError} />
        </Modal>
      )}

      {confirm === 'anular' && canje && (
        <ConfirmModal
          title="Anular canje"
          message={`Se le devuelven ${fmt(canje.costo_puntos)} puntos a ${nombre}.`}
          confirmLabel="Anular y devolver"
          busy={busy}
          error={confirmError}
          onConfirm={doAnular}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}
