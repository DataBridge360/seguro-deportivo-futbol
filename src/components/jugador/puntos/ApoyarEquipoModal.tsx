'use client'

import { useEffect, useRef, useState } from 'react'
import { apoyarEquipoPuntos, getApoyarPuntos, type ApoyarEquipoResponse, type RankingEquipoPuntos } from '@/lib/api'
import { ErrorNote, Modal, Spinner, errMsg, fmt, primaryBtnCls } from '@/components/club/puntos/ui'
import TeamLogo from './TeamLogo'

const STEP = 10
const MAX_POINTS = 1000000

const roundBtnCls =
  'flex size-12 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

const quickBtnCls =
  'min-h-11 min-w-16 flex-1 rounded-full border border-slate-300 bg-slate-50 px-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'

// Centered modal to support a team with points. When `saldo` is undefined it loads the balance itself.
export default function ApoyarEquipoModal({
  equipo,
  saldo: saldoProp,
  onClose,
  onDone,
}: {
  equipo: RankingEquipoPuntos
  saldo?: number
  onClose: () => void
  onDone: (saldo: number) => void
}) {
  const [loadedSaldo, setLoadedSaldo] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ApoyarEquipoResponse | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (saldoProp !== undefined) return
    let cancelled = false
    getApoyarPuntos()
      .then(r => {
        if (!cancelled) setLoadedSaldo(r.saldo)
      })
      .catch(e => {
        if (!cancelled) setLoadError(errMsg(e, 'No pudimos cargar tus puntos.'))
      })
    return () => {
      cancelled = true
    }
  }, [saldoProp])

  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => closeRef.current(), 1500)
    return () => clearTimeout(t)
  }, [result])

  const saldo = saldoProp ?? loadedSaldo
  const puntos = Number(raw) || 0
  const invalid = saldo === null || puntos < 1 || puntos > saldo
  const quick = saldo === null ? [] : [10, 50, 100].filter(n => n < saldo)

  const submit = async () => {
    if (invalid || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await apoyarEquipoPuntos(equipo.torneo_equipo_id, puntos)
      setResult(res)
      onDone(res.saldo)
    } catch (e) {
      setError(errMsg(e, 'No pudimos registrar tus puntos.'))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    const nombre = result.equipo_nombre || equipo.equipo_nombre
    return (
      <Modal
        title="¡Gracias por apoyar!"
        onClose={onClose}
        footer={
          <button type="button" onClick={onClose} className={`${primaryBtnCls} w-full`}>
            Listo
          </button>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span
            className="material-symbols-outlined text-7xl text-emerald-500 transition duration-500 starting:scale-50 starting:opacity-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            check_circle
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">¡Gracias por apoyar a {nombre}!</p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Le diste {fmt(result.puntos)} puntos. Te quedan {fmt(result.saldo)}.
          </p>
        </div>
      </Modal>
    )
  }

  const noPoints = saldo === 0
  const setAmount = (n: number) => setRaw(n > 0 ? String(n) : '')

  return (
    <Modal
      title="Apoyar equipo"
      onClose={onClose}
      busy={busy}
      footer={
        noPoints ? (
          <button type="button" onClick={onClose} className={`${primaryBtnCls} w-full`}>
            Cerrar
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy || invalid} className={`${primaryBtnCls} w-full`}>
            {busy && <Spinner />}
            {puntos > 0 ? `Apoyar con ${fmt(puntos)} puntos` : 'Apoyar'}
          </button>
        )
      }
    >
      <div className="flex items-center gap-3">
        <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-16 border-2 border-amber-400" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
          <p className="text-base text-slate-600 dark:text-slate-300">Va {equipo.posicion}° en puntos de apoyo</p>
        </div>
      </div>

      {loadError ? (
        <ErrorNote message={loadError} />
      ) : saldo === null ? (
        <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" aria-hidden />
      ) : noPoints ? (
        <p className="rounded-xl bg-slate-100 p-4 text-center text-base text-slate-700 dark:bg-slate-700 dark:text-slate-100">
          Todavía no tenés puntos. Sumás comprando en la cantina.
        </p>
      ) : (
        <>
          <p className="text-center text-base text-slate-600 dark:text-slate-300">
            Tenés <span className="font-bold text-slate-900 dark:text-white">{fmt(saldo)}</span> puntos
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Restar 10 puntos"
              onClick={() => setAmount(Math.max(0, puntos - STEP))}
              disabled={busy || puntos <= 0}
              className={roundBtnCls}
            >
              <span className="material-symbols-outlined" aria-hidden>
                remove
              </span>
            </button>
            <label className="block min-w-0 flex-1">
              <span className="sr-only">¿Cuántos puntos querés dar?</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={raw}
                onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 7))}
                placeholder="0"
                className="h-16 w-full rounded-2xl border border-slate-300 bg-white text-center text-4xl font-extrabold tabular-nums text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </label>
            <button
              type="button"
              aria-label="Sumar 10 puntos"
              onClick={() => setAmount(Math.min(saldo, puntos + STEP))}
              disabled={busy || puntos >= saldo}
              className={roundBtnCls}
            >
              <span className="material-symbols-outlined" aria-hidden>
                add
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Cantidades rápidas">
            {quick.map(n => (
              <button key={n} type="button" onClick={() => setAmount(n)} className={quickBtnCls}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setAmount(Math.min(saldo, MAX_POINTS))} className={quickBtnCls}>
              Todo
            </button>
          </div>

          <p
            className={`text-center text-base font-semibold ${
              puntos > saldo ? 'text-red-600 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'
            }`}
          >
            {puntos > saldo ? 'No te alcanzan los puntos' : `Te quedan ${fmt(saldo - puntos)}`}
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Son puntos de apoyo: no cuentan para la tabla del torneo.
          </p>
          <ErrorNote message={error} />
        </>
      )}
    </Modal>
  )
}
