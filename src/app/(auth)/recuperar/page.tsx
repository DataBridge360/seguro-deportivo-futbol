'use client'

import { useState } from 'react'
import Image from 'next/image'
import { consultarRecuperacion, enviarRecuperacion, type ConsultarRecuperacionResult } from '@/lib/api'
import BallsBackground from '@/components/auth/BallsBackground'
import { buildAsistenciaWhatsappUrl } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Recuperación de contraseña: paso 1 pide el DNI, paso 2 muestra si el
// jugador tiene un correo cargado (y permite enviar el link) o lo deriva a
// Asistencia por WhatsApp si no tiene. El backend nunca revela si el DNI
// existe cuando no hay correo cargado.
// ---------------------------------------------------------------------------

const DNI_REGEX = /^\d{7,8}$/

function limpiarDni(value: string): string {
  return value.replace(/[.\s]/g, '').replace(/\D/g, '')
}

type Step = 'dni' | 'result' | 'sent'

function VolverAlLogin() {
  return (
    <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-3">
      <a href="/login" className="text-primary font-bold hover:underline">
        Volver al login
      </a>
    </p>
  )
}

export default function RecuperarPage() {
  const [step, setStep] = useState<Step>('dni')

  const [dni, setDni] = useState('')
  const [dniError, setDniError] = useState<string | null>(null)
  const [checkingDni, setCheckingDni] = useState(false)

  const [resultado, setResultado] = useState<ConsultarRecuperacionResult | null>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleDniSubmit = async () => {
    const limpio = limpiarDni(dni)
    setDni(limpio)

    if (!DNI_REGEX.test(limpio)) {
      setDniError('Ingresá un DNI válido (7 u 8 dígitos)')
      return
    }
    setDniError(null)
    setCheckingDni(true)
    try {
      const res = await consultarRecuperacion(limpio)
      setResultado(res)
      setStep('result')
    } catch (err) {
      setDniError(err instanceof Error ? err.message : 'No se pudo consultar el DNI')
    } finally {
      setCheckingDni(false)
    }
  }

  const handleEnviarLink = async () => {
    if (sending) return
    setSendError(null)
    setSending(true)
    try {
      await enviarRecuperacion(dni)
      setStep('sent')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'No se pudo enviar el link')
    } finally {
      setSending(false)
    }
  }

  const handleUsarOtroDni = () => {
    setResultado(null)
    setSendError(null)
    setDniError(null)
    setStep('dni')
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-sky-400 via-primary to-blue-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950">
      <BallsBackground />
      <div className="relative z-10 w-full max-w-md bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-950/40 ring-1 ring-white/60 dark:ring-slate-700/50 overflow-hidden football-pattern animate-slide-up">
        {/* Header */}
        <div className="pt-8 pb-4 flex flex-col items-center px-6">
          <div className="mb-3">
            <Image
              src="/logo.png"
              alt="Logo del Complejo Deportivo"
              width={110}
              height={110}
              className="w-24 h-24 object-contain"
              priority
            />
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white text-center leading-tight tracking-tight">
            Recuperar contraseña
          </h1>
        </div>

        <div className="px-6 pb-8 space-y-4">
          {/* Paso 1: DNI */}
          {step === 'dni' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label htmlFor="dni" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  DNI
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    badge
                  </span>
                  <input
                    id="dni"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={dni}
                    onChange={(e) => {
                      setDni(e.target.value.replace(/\D/g, ''))
                      setDniError(null)
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Ingresá tu DNI"
                    autoComplete="off"
                  />
                </div>
                {dniError && (
                  <p className="text-sm text-red-500 ml-1" aria-live="polite">
                    {dniError}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleDniSubmit}
                disabled={checkingDni}
                className="w-full bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {checkingDni ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Consultando...
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>

              <VolverAlLogin />
            </div>
          )}

          {/* Paso 2: resultado de la consulta */}
          {step === 'result' && resultado && (
            <div className="space-y-4 animate-fade-in">
              {resultado.tiene_correo ? (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Te vamos a enviar un link a{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {resultado.email_enmascarado}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Va a llegar de <span className="font-semibold">Club Plaza</span> (no-responder@databridge360.dev).
                    Si no lo ves, revisá la carpeta de spam o correo no deseado.
                  </p>

                  {sendError && (
                    <div
                      className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
                      aria-live="polite"
                    >
                      {sendError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleEnviarLink}
                    disabled={sending}
                    className="w-full bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <span>Enviar link</span>
                        <span className="material-symbols-outlined text-lg">send</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No tenemos un correo cargado para ese DNI. Pedí ayuda a Asistencia y te ayudamos a recuperar el
                    acceso.
                  </p>
                  <a
                    href={buildAsistenciaWhatsappUrl(
                      `Hola, necesito ayuda para recuperar mi contraseña de Club Plaza. Mi DNI es ${dni}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                    Asistencia
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={handleUsarOtroDni}
                className="w-full bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Usar otro DNI
              </button>

              <VolverAlLogin />
            </div>
          )}

          {/* Paso 3: link enviado */}
          {step === 'sent' && (
            <div className="space-y-4 animate-fade-in text-center" role="status" aria-live="polite">
              <span className="material-symbols-outlined text-5xl text-emerald-500">mark_email_read</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Si el DNI está registrado y tiene correo, te enviamos un link para restablecer la contraseña.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Va a llegar de <span className="font-semibold">Club Plaza</span>{' '}
                <span className="break-all">(no-responder@databridge360.dev)</span>. Si no lo ves en unos minutos,
                revisá la carpeta de spam o correo no deseado. El link vence en 30 minutos.
              </p>

              <a
                href="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Volver al login
              </a>
            </div>
          )}
        </div>

        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>
    </div>
  )
}
