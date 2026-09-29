'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apoyarEquipoPuntos, type ApoyarEquipoResponse, type RankingEquipoPuntos } from '@/lib/api'
import { ErrorNote, Modal, Spinner, errMsg, fmt, inputCls, primaryBtnCls, secondaryBtnCls } from '@/components/club/puntos/ui'
import TeamLogo from './TeamLogo'

const CONFETTI = ['#f43f5e', '#f59e0b', '#1392ec', '#10b981', '#a855f7', '#f43f5e', '#f59e0b', '#1392ec', '#10b981', '#a855f7']

function Celebration() {
  return (
    <div className="relative flex h-32 items-center justify-center overflow-hidden" aria-hidden>
      <style>{`
        @keyframes apoyar-pop { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.25); opacity: 1 } 100% { transform: scale(1) } }
        @keyframes apoyar-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(120px) rotate(360deg); opacity: 0 } }
        .apoyar-heart { animation: apoyar-pop 0.6s ease-out both, apoyar-beat 1.2s ease-in-out 0.6s infinite }
        @keyframes apoyar-beat { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
        .apoyar-piece { animation: apoyar-fall 1.6s ease-in both }
        @media (prefers-reduced-motion: reduce) { .apoyar-heart, .apoyar-piece { animation: none } .apoyar-piece { display: none } }
      `}</style>
      {CONFETTI.map((color, i) => (
        <span
          key={i}
          className="apoyar-piece absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${8 + i * 9}%`, backgroundColor: color, animationDelay: `${(i % 5) * 0.12}s` }}
        />
      ))}
      <span
        className="apoyar-heart material-symbols-outlined text-7xl text-rose-500"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        favorite
      </span>
    </div>
  )
}

export default function ApoyarModal({
  equipo,
  saldo,
  onClose,
  onDone,
}: {
  equipo: RankingEquipoPuntos
  saldo: number
  onClose: () => void
  onDone: () => void
}) {
  const router = useRouter()
  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ApoyarEquipoResponse | null>(null)

  const puntos = Number(raw) || 0
  const restan = saldo - puntos
  const invalid = puntos < 1 || puntos > saldo
  const quick = [10, 50, 100].filter(n => n < saldo)

  const submit = async () => {
    if (invalid || busy) return
    setBusy(true)
    setError('')
    try {
      setResult(await apoyarEquipoPuntos(equipo.torneo_equipo_id, puntos))
      onDone()
    } catch (e) {
      setError(errMsg(e, 'No pudimos registrar tu apoyo.'))
    } finally {
      setBusy(false)
    }
  }

  if (result) {
    return (
      <Modal
        title="¡Gracias por apoyar!"
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/jugador/puntos/tabla?torneo=${encodeURIComponent(result.torneo_id)}`)}
              className={secondaryBtnCls}
            >
              Ver la tabla
            </button>
            <button type="button" onClick={onClose} className={primaryBtnCls}>
              Listo
            </button>
          </>
        }
      >
        <Celebration />
        <p className="text-center text-lg font-bold text-slate-900 dark:text-white">
          Ahora {result.equipo_nombre || equipo.equipo_nombre} tiene {fmt(result.total_equipo)} puntos
        </p>
        <p className="rounded-xl bg-primary/10 p-3 text-center text-base font-semibold text-primary dark:bg-primary/20 dark:text-sky-300">
          Tu nuevo saldo: {fmt(result.saldo)} puntos
        </p>
      </Modal>
    )
  }

  return (
    <Modal
      title="Apoyar equipo"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryBtnCls}>
            Cancelar
          </button>
          <button type="button" onClick={submit} disabled={busy || invalid} className={primaryBtnCls}>
            {busy && <Spinner />}
            {puntos > 0 ? `Apoyar con ${fmt(puntos)} puntos` : 'Apoyar'}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-16" />
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            {fmt(equipo.total)} puntos · Tenés {fmt(saldo)}
          </p>
        </div>
      </div>

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
        {saldo > 0 && (
          <button type="button" onClick={() => setRaw(String(Math.min(saldo, 1000000)))} className={`${secondaryBtnCls} min-w-20 flex-1`}>
            Todo
          </button>
        )}
      </div>

      <p
        className={`text-center text-base font-semibold ${
          puntos > saldo ? 'text-red-600 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {puntos > saldo ? 'No te alcanzan los puntos' : `Te quedan ${fmt(restan)}`}
      </p>
      <ErrorNote message={error} />
    </Modal>
  )
}
