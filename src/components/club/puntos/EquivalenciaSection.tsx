'use client'

import { useEffect, useState } from 'react'
import { getPuntosConfig, guardarPuntosConfig } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { ErrorNote, Spinner, fmt, inputCls, primaryBtnCls } from './ui'

const MAX_MONTO = 100_000_000
const MAX_PUNTOS = 1_000_000

// Accepts comma or dot as decimal separator
function parseMonto(raw: string): number {
  const v = raw.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(v)) return NaN
  return Number(v)
}

function validate(montoRaw: string, puntosRaw: string): string | null {
  const monto = parseMonto(montoRaw)
  if (!Number.isFinite(monto) || monto <= 0) return 'Ingresá un monto de compra mayor a 0.'
  if (monto > MAX_MONTO) return 'El monto de compra es demasiado alto.'
  if (Math.round(monto * 100) / 100 !== monto) return 'El monto admite hasta 2 decimales.'
  if (!/^\d+$/.test(puntosRaw.trim())) return 'Los puntos deben ser un número entero.'
  const puntos = Number(puntosRaw)
  if (puntos < 1 || puntos > MAX_PUNTOS) return `Los puntos deben estar entre 1 y ${fmt(MAX_PUNTOS)}.`
  return null
}

export default function EquivalenciaSection() {
  // The club administrator sees the equivalence but only the owner changes it
  const readOnly = useAuthStore(state => state.user?.acceso_limitado === true)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [hasConfig, setHasConfig] = useState(false)
  const [monto, setMonto] = useState('')
  const [puntos, setPuntos] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    getPuntosConfig()
      .then(cfg => {
        if (!active) return
        if (cfg) {
          setHasConfig(true)
          setMonto(String(Number(cfg.monto_base)).replace('.', ','))
          setPuntos(String(Number(cfg.puntos)))
        }
      })
      .catch(e => {
        if (active) setLoadError(e instanceof Error ? e.message : 'No pudimos cargar la configuración.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const montoNum = parseMonto(monto)
  const puntosNum = /^\d+$/.test(puntos.trim()) ? Number(puntos) : NaN
  const example =
    Number.isFinite(montoNum) && montoNum > 0 && Number.isFinite(puntosNum)
      ? Math.floor((5000 * puntosNum) / montoNum)
      : null

  const handleSave = async () => {
    setSaved(false)
    const err = validate(monto, puntos)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setSaving(true)
    try {
      await guardarPuntosConfig({ monto_base: montoNum, puntos: puntosNum, activo: true })
      setHasConfig(true)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-base text-slate-500 dark:text-slate-400">
        Cada compra en la cantina suma puntos al jugador según esta equivalencia. Los puntos se calculan sobre lo que el jugador paga: el descuento de un cupón no suma puntos.
      </p>

      {loading ? (
        <div className="space-y-3">
          <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
        </div>
      ) : loadError ? (
        <ErrorNote message={loadError} />
      ) : readOnly ? (
        <>
          <div className="rounded-xl bg-slate-50 p-4 text-base text-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
            {hasConfig && Number.isFinite(montoNum) && Number.isFinite(puntosNum) ? (
              <p>
                Cada <span className="font-bold">${fmt(montoNum)}</span> de compra suman{' '}
                <span className="font-bold">{fmt(puntosNum)} puntos</span>.
              </p>
            ) : (
              <p>Todavía no hay una equivalencia configurada.</p>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-lg">lock</span>
            Solo el responsable del club puede cambiar la equivalencia.
          </p>
        </>
      ) : (
        <>
          {!hasConfig && (
            <p className="rounded-xl bg-amber-50 p-3 text-base text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              Todavía no configuraste los puntos
            </p>
          )}

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/50">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 text-base text-slate-700 dark:text-slate-200">
              <span className="font-medium">Cada $</span>
              <div className="min-w-[8rem] flex-1">
                <label htmlFor="monto" className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Monto de compra ($)
                </label>
                <input
                  id="monto"
                  inputMode="decimal"
                  value={monto}
                  onChange={e => {
                    setMonto(e.target.value)
                    setSaved(false)
                  }}
                  placeholder="1000"
                  className={inputCls}
                />
              </div>
              <span className="font-medium">suman</span>
              <div className="min-w-[8rem] flex-1">
                <label htmlFor="puntos" className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Puntos que suma
                </label>
                <input
                  id="puntos"
                  inputMode="numeric"
                  value={puntos}
                  onChange={e => {
                    setPuntos(e.target.value)
                    setSaved(false)
                  }}
                  placeholder="10"
                  className={inputCls}
                />
              </div>
              <span className="font-medium">puntos</span>
            </div>
          </div>

          <p className="text-base text-slate-600 dark:text-slate-300">
            {example !== null
              ? `Ejemplo: una compra de $5.000 suma ${fmt(example)} puntos`
              : 'Completá los dos campos para ver un ejemplo.'}
          </p>

          <ErrorNote message={error} />
          {saved && (
            <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-base text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="material-symbols-outlined">check_circle</span>
              Guardado
            </p>
          )}

          <button type="button" onClick={handleSave} disabled={saving} className={`${primaryBtnCls} w-full`}>
            {saving && <Spinner />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      )}
    </section>
  )
}
