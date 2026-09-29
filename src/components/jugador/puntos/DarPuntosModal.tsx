'use client'

import { useEffect, useState } from 'react'
import { apoyarEquipoPuntos, getApoyarPuntos, type ApoyarEquipoResponse, type RankingEquipoPuntos } from '@/lib/api'
import { ErrorNote, Modal, Spinner, errMsg, fmt, inputCls, primaryBtnCls, secondaryBtnCls } from '@/components/club/puntos/ui'
import TeamLogo from './TeamLogo'

// One-step modal to give points to a team. When `saldo` is undefined it loads the balance itself.
export default function DarPuntosModal({
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
    const t = setTimeout(onClose, 1800)
    return () => clearTimeout(t)
  }, [result, onClose])

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
    return (
      <Modal
        title="¡Gracias!"
        onClose={onClose}
        footer={
          <button type="button" onClick={onClose} className={primaryBtnCls}>
            Listo
          </button>
        }
      >
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <span className="material-symbols-outlined text-6xl text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
            check_circle
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            Le diste {fmt(result.puntos)} puntos a {result.equipo_nombre || equipo.equipo_nombre}
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300">Te quedan {fmt(result.saldo)} puntos</p>
        </div>
      </Modal>
    )
  }

  const noPoints = saldo === 0

  return (
    <Modal
      title="Dar puntos"
      onClose={onClose}
      busy={busy}
      footer={
        noPoints ? (
          <button type="button" onClick={onClose} className={secondaryBtnCls}>
            Cerrar
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} disabled={busy} className={secondaryBtnCls}>
              Cancelar
            </button>
            <button type="button" onClick={submit} disabled={busy || invalid} className={primaryBtnCls}>
              {busy && <Spinner />}
              {puntos > 0 ? `Dar ${fmt(puntos)} puntos` : 'Dar puntos'}
            </button>
          </>
        )
      }
    >
      <div className="flex items-center gap-3">
        <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-16" />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
          <p className="text-base text-slate-600 dark:text-slate-300">{fmt(equipo.total)} puntos</p>
        </div>
      </div>

      {loadError ? (
        <ErrorNote message={loadError} />
      ) : saldo === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" aria-hidden />
      ) : noPoints ? (
        <p className="rounded-xl bg-slate-100 p-4 text-center text-base text-slate-700 dark:bg-slate-700 dark:text-slate-100">
          Todavía no tenés puntos. Sumás comprando en la cantina.
        </p>
      ) : (
        <>
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-700 dark:text-slate-300">¿Cuántos puntos querés dar?</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={raw}
              onChange={e => setRaw(e.target.value.replace(/\D/g, '').slice(0, 7))}
              placeholder="0"
              className={`${inputCls} h-16 text-center text-3xl font-extrabold`}
            />
          </label>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Cantidades rápidas">
            {quick.map(n => (
              <button key={n} type="button" onClick={() => setRaw(String(n))} className={`${secondaryBtnCls} min-w-20 flex-1`}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setRaw(String(Math.min(saldo, 1000000)))} className={`${secondaryBtnCls} min-w-20 flex-1`}>
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
          <ErrorNote message={error} />
        </>
      )}
    </Modal>
  )
}
