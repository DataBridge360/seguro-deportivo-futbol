'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { canjearRecompensaPuntos, type CanjearRecompensaResponse, type PuntosCatalogoRecompensa } from '@/lib/api'
import { ErrorNote, Modal, Spinner, errMsg, fmt, primaryBtnCls, secondaryBtnCls } from '@/components/club/puntos/ui'
import CanjeQr from './CanjeQr'
import RewardImage from './RewardImage'

type Step = 'detail' | 'confirm' | 'done'

export default function RecompensaModal({
  recompensa,
  saldo,
  onClose,
  onRedeemed,
}: {
  recompensa: PuntosCatalogoRecompensa
  saldo: number
  onClose: () => void
  onRedeemed: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('detail')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CanjearRecompensaResponse | null>(null)

  const faltan = recompensa.costo_puntos - saldo
  const blockedReason = recompensa.agotado
    ? 'Esta recompensa se agotó'
    : faltan > 0
      ? `Te faltan ${fmt(faltan)} puntos`
      : ''

  const redeem = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await canjearRecompensaPuntos(recompensa.id)
      setResult(res)
      setStep('done')
      onRedeemed()
    } catch (e) {
      setError(errMsg(e, 'No pudimos canjear la recompensa.'))
      setStep('detail')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'done' && result) {
    return (
      <Modal
        title="¡Canje listo!"
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={() => router.push('/dashboard/jugador/puntos/canjes')} className={secondaryBtnCls}>
              Ver mis canjes
            </button>
            <button type="button" onClick={onClose} className={primaryBtnCls}>
              Listo
            </button>
          </>
        }
      >
        <p className="text-center text-lg font-bold text-slate-900 dark:text-white">{result.recompensa.titulo}</p>
        <CanjeQr codigo={result.codigo} />
        <p className="rounded-xl bg-primary/10 p-3 text-center text-base font-semibold text-primary dark:bg-primary/20 dark:text-sky-300">
          Tu nuevo saldo: {fmt(result.saldo)} puntos
        </p>
      </Modal>
    )
  }

  if (step === 'confirm') {
    return (
      <Modal
        title="Confirmar canje"
        onClose={onClose}
        busy={busy}
        footer={
          <>
            <button type="button" onClick={() => setStep('detail')} disabled={busy} className={secondaryBtnCls}>
              Volver
            </button>
            <button type="button" onClick={redeem} disabled={busy} className={primaryBtnCls}>
              {busy && <Spinner />}
              Confirmar canje
            </button>
          </>
        }
      >
        <p className="text-base text-slate-700 dark:text-slate-200">
          ¿Canjear <span className="font-bold">{recompensa.titulo}</span> por {fmt(recompensa.costo_puntos)} puntos? Te
          quedan {fmt(saldo - recompensa.costo_puntos)}.
        </p>
        <ErrorNote message={error} />
      </Modal>
    )
  }

  return (
    <Modal
      title="Recompensa"
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setError('')
              setStep('confirm')
            }}
            disabled={Boolean(blockedReason)}
            className={`${primaryBtnCls} w-full`}
          >
            Canjear por {fmt(recompensa.costo_puntos)} puntos
          </button>
          {blockedReason && <p className="text-center text-base text-slate-600 dark:text-slate-300">{blockedReason}</p>}
        </div>
      }
    >
      <RewardImage
        src={recompensa.imagen_url}
        alt={recompensa.titulo}
        className="mx-auto aspect-square w-full max-w-xs rounded-2xl"
        iconClass="text-7xl"
      />
      <div className="space-y-1">
        {recompensa.categoria_nombre && (
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {recompensa.categoria_nombre}
          </p>
        )}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{recompensa.titulo}</h3>
        {recompensa.descripcion && (
          <p className="text-base text-slate-600 dark:text-slate-300">{recompensa.descripcion}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-2xl font-extrabold text-primary dark:text-sky-300">{fmt(recompensa.costo_puntos)} puntos</span>
        {recompensa.stock !== null && recompensa.stock <= 10 && !recompensa.agotado && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Quedan {recompensa.stock}
          </span>
        )}
      </div>
      <ErrorNote message={error} />
    </Modal>
  )
}
