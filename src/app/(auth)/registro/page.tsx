'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { getDefaultRouteForRole } from '@/lib/navigation'
import { clearAuthCookie, setAuthCookie } from '@/lib/authCookie'
import { checkDniDisponible } from '@/lib/registroApi'
import { buildAsistenciaWhatsappUrl } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Validaciones (reflejan las reglas del backend en español para feedback
// inmediato; el backend siempre vuelve a validar).
// ---------------------------------------------------------------------------

const DNI_REGEX = /^\d{7,8}$/
const NOMBRE_REGEX = /^[\p{L}'\- ]{1,60}$/u
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_REGEX = /^\+?\d{6,15}$/

function limpiarDni(value: string): string {
  return value.replace(/[.\s]/g, '').replace(/\D/g, '')
}

function validarFechaNacimiento(value: string): string | null {
  if (!value) return 'Ingresá tu fecha de nacimiento'
  const fecha = new Date(`${value}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return 'Fecha inválida'

  const hoy = new Date()
  if (fecha.getTime() > hoy.getTime()) return 'La fecha no puede ser futura'

  const hace100Anios = new Date(hoy)
  hace100Anios.setFullYear(hoy.getFullYear() - 100)
  if (fecha.getTime() < hace100Anios.getTime()) return 'La fecha no puede ser de hace más de 100 años'

  return null
}

const STEP_LABELS = ['DNI', 'Datos', 'Contacto', 'Contraseña', 'Confirmar']

function AsistenciaButton({ mensaje }: { mensaje?: string }) {
  return (
    <a
      href={buildAsistenciaWhatsappUrl(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 text-sm font-bold text-red-600 dark:text-red-400 hover:underline"
    >
      <span className="material-symbols-outlined text-base">support_agent</span>
      Contactar asistencia por WhatsApp
    </a>
  )
}

export default function RegistroPage() {
  const { register, isLoading, error, clearError, user, isAuthenticated, _hasHydrated } = useAuthStore()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  // Paso 1
  const [dni, setDni] = useState('')
  const [dniError, setDniError] = useState<string | null>(null)
  const [checkingDni, setCheckingDni] = useState(false)
  const [dniTaken, setDniTaken] = useState(false)

  // Paso 2
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({})

  // Paso 3
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({})

  // Paso 4
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [step4Errors, setStep4Errors] = useState<Record<string, string>>({})

  const submittingRef = useRef(false)
  const didInitRef = useRef(false)

  useEffect(() => {
    if (!_hasHydrated || didInitRef.current) return
    didInitRef.current = true

    if (isAuthenticated && user) {
      if (!submittingRef.current) {
        window.location.replace(getDefaultRouteForRole(user.role))
      }
      return
    }

    clearAuthCookie()
  }, [_hasHydrated])

  const goToStep = (next: number, dir: 'forward' | 'back') => {
    setDirection(dir)
    setStep(next)
  }

  const handleDniNext = async () => {
    const limpio = limpiarDni(dni)
    setDni(limpio)
    setDniTaken(false)

    if (!DNI_REGEX.test(limpio)) {
      setDniError('Ingresá un DNI válido (7 u 8 dígitos)')
      return
    }
    setDniError(null)
    setCheckingDni(true)
    try {
      const disponible = await checkDniDisponible(limpio)
      if (!disponible) {
        setDniTaken(true)
        return
      }
      goToStep(2, 'forward')
    } catch (err) {
      setDniError(err instanceof Error ? err.message : 'No se pudo verificar el DNI')
    } finally {
      setCheckingDni(false)
    }
  }

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!NOMBRE_REGEX.test(nombre.trim())) errors.nombre = 'Ingresá un nombre válido (solo letras)'
    if (!NOMBRE_REGEX.test(apellido.trim())) errors.apellido = 'Ingresá un apellido válido (solo letras)'
    const fechaError = validarFechaNacimiento(fechaNacimiento)
    if (fechaError) errors.fechaNacimiento = fechaError
    setStep2Errors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Ingresá un email válido'
    if (telefono.trim() && !TELEFONO_REGEX.test(telefono.trim())) {
      errors.telefono = 'Ingresá un teléfono válido (6 a 15 dígitos, opcionalmente con +)'
    }
    setStep3Errors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {}
    if (password.length < 8 || password.length > 72) {
      errors.password = 'La contraseña debe tener entre 8 y 72 caracteres'
    }
    if (password !== passwordConfirm) {
      errors.passwordConfirm = 'Las contraseñas no coinciden'
    }
    setStep4Errors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCrearCuenta = async () => {
    if (isLoading) return
    clearError()

    const success = await register({
      dni,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      fecha_nacimiento: fechaNacimiento,
      email: email.trim(),
      telefono: telefono.trim() || undefined,
      password,
      password_confirmacion: passwordConfirm,
    })

    if (success) {
      submittingRef.current = true
      const { user: newUser } = useAuthStore.getState()
      if (newUser) {
        setAuthCookie(newUser)
        window.location.replace(getDefaultRouteForRole(newUser.role))
      }
    }
  }

  const showAsistenciaForError = error
    ? /ya est[aá] en uso|no est[aá] disponible en este momento/i.test(error)
    : false

  const animationClass = direction === 'forward' ? 'animate-fade-in' : 'animate-fade-in'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-background-dark soccer-bg">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 overflow-hidden football-pattern animate-slide-up">
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
            Crear cuenta de <span className="text-primary">jugador</span>
          </h1>
        </div>

        {/* Progress indicator */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, idx) => {
              const stepNumber = idx + 1
              const isActive = stepNumber === step
              const isDone = stepNumber < step
              return (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDone
                          ? 'bg-primary text-white'
                          : isActive
                            ? 'bg-primary/20 text-primary ring-2 ring-primary'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        stepNumber
                      )}
                    </div>
                  </div>
                  {stepNumber !== STEP_LABELS.length && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-colors ${
                        isDone ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-1.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            Paso {step} de {STEP_LABELS.length}: {STEP_LABELS[step - 1]}
          </p>
        </div>

        <div className="px-6 pb-8 space-y-4">
          {/* Paso 1: DNI */}
          {step === 1 && (
            <div key="step-1" className={`space-y-4 ${animationClass}`}>
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
                      setDniTaken(false)
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Ingresá tu DNI"
                    autoComplete="off"
                  />
                </div>
                {dniError && <p className="text-sm text-red-500 ml-1">{dniError}</p>}
                {dniTaken && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    <p>Este DNI ya está en uso</p>
                    <AsistenciaButton mensaje="Hola, quiero registrarme pero mi DNI figura como ya utilizado. ¿Me ayudan?" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleDniNext}
                disabled={checkingDni}
                className="w-full bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                {checkingDni ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Verificando...
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Paso 2: Nombre, apellido, fecha de nacimiento */}
          {step === 2 && (
            <div key="step-2" className={`space-y-4 ${animationClass}`}>
              <div className="space-y-1.5">
                <label htmlFor="nombre" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Nombre
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    person
                  </span>
                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                  />
                </div>
                {step2Errors.nombre && <p className="text-sm text-red-500 ml-1">{step2Errors.nombre}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="apellido" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Apellido
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    badge
                  </span>
                  <input
                    id="apellido"
                    type="text"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Tu apellido"
                    autoComplete="family-name"
                  />
                </div>
                {step2Errors.apellido && <p className="text-sm text-red-500 ml-1">{step2Errors.apellido}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="fechaNacimiento" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Fecha de nacimiento
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    cake
                  </span>
                  <input
                    id="fechaNacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                {step2Errors.fechaNacimiento && (
                  <p className="text-sm text-red-500 ml-1">{step2Errors.fechaNacimiento}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(1, 'back')}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => validateStep2() && goToStep(3, 'forward')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Email, teléfono */}
          {step === 3 && (
            <div key="step-3" className={`space-y-4 ${animationClass}`}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </div>
                {step3Errors.email && <p className="text-sm text-red-500 ml-1">{step3Errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="telefono" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    call
                  </span>
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="+54 9 299 ..."
                    autoComplete="tel"
                  />
                </div>
                {step3Errors.telefono && <p className="text-sm text-red-500 ml-1">{step3Errors.telefono}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(2, 'back')}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => validateStep3() && goToStep(4, 'forward')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Paso 4: Contraseña */}
          {step === 4 && (
            <div key="step-4" className={`space-y-4 ${animationClass}`}>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {step4Errors.password && <p className="text-sm text-red-500 ml-1">{step4Errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="passwordConfirm" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Repetir contraseña
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/70 text-xl">
                    lock
                  </span>
                  <input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    placeholder="Repetí tu contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-primary transition-colors text-xl"
                  >
                    {showPasswordConfirm ? 'visibility_off' : 'visibility'}
                  </button>
                </div>
                {step4Errors.passwordConfirm ? (
                  <p className="text-sm text-red-500 ml-1">{step4Errors.passwordConfirm}</p>
                ) : (
                  passwordConfirm.length > 0 && (
                    <p
                      className={`text-sm ml-1 ${
                        password === passwordConfirm ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                      }`}
                    >
                      {password === passwordConfirm ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </p>
                  )
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(3, 'back')}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => validateStep4() && goToStep(5, 'forward')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-primary text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  Siguiente
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Paso 5: Resumen / confirmar */}
          {step === 5 && (
            <div key="step-5" className={`space-y-4 ${animationClass}`}>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500 dark:text-slate-400">DNI</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{dni}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Nombre</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{nombre} {apellido}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Nacimiento</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{fechaNacimiento}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500 dark:text-slate-400">Email</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[60%]">{email}</span>
                </div>
                {telefono && (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-slate-500 dark:text-slate-400">Teléfono</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{telefono}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  <p>{error}</p>
                  {showAsistenciaForError && (
                    <AsistenciaButton mensaje="Hola, tuve un problema al crear mi cuenta en el sistema del complejo. ¿Me ayudan?" />
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(4, 'back')}
                  disabled={isLoading}
                  className="flex-1 bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleCrearCuenta}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                      Creando...
                    </>
                  ) : (
                    <>
                      <span>Crear cuenta</span>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-1">
            &iquest;Ya ten&eacute;s cuenta?{' '}
            <a href="/login" className="text-primary font-bold hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>

        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>
    </div>
  )
}
