'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { getDefaultRouteForRole } from '@/lib/navigation'
import { clearAuthCookie, setAuthCookie } from '@/lib/authCookie'
import { checkDniDisponible } from '@/lib/registroApi'
import { buildAsistenciaWhatsappUrl } from '@/lib/constants'
import DatePicker from '@/components/ui/DatePicker'

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

// ---------------------------------------------------------------------------
// Fondo decorativo: elementos deportivos del club flotando (fútbol, básquet,
// tenis, pádel y pileta). Posiciones deterministas (semilla fija)
// para que el render del servidor y del cliente coincidan.
// ---------------------------------------------------------------------------

const BALL_SPRITES = ['soccer', 'basketball', 'tennis', 'padel', 'lifebuoy', 'goggles'] as const

// Best-candidate (Mitchell) sampling parameters. Points are generated in
// percentage space (0-100) with an aspect-corrected distance metric so the
// perceived spacing looks even on wide screens.
const POINT_COUNT = 28
const CANDIDATES_PER_POINT = 20
const MIN_PCT = 4
const MAX_PCT = 96
const ASPECT_RATIO = 1.6
const MOBILE_VISIBLE_COUNT = 12

// Central card zone (desktop) to avoid hiding too many sprites behind it.
const CARD_ZONE_X = [34, 66] as const
const CARD_ZONE_Y = [12, 88] as const

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function isInCardZone(x: number, y: number): boolean {
  return x >= CARD_ZONE_X[0] && x <= CARD_ZONE_X[1] && y >= CARD_ZONE_Y[0] && y <= CARD_ZONE_Y[1]
}

function aspectDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx = (ax - bx) * ASPECT_RATIO
  const dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

/** Best-candidate (Mitchell) sampling: for each new point, generate several
 * random candidates and keep the one maximizing the minimum distance to the
 * points already placed. Deterministic given a seeded `rand`. */
function bestCandidateSample(rand: () => number, count: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let guard = 0
  while (points.length < count && guard < count * 200) {
    guard++
    let best: { x: number; y: number } | null = null
    let bestScore = -Infinity
    for (let c = 0; c < CANDIDATES_PER_POINT; c++) {
      const x = MIN_PCT + rand() * (MAX_PCT - MIN_PCT)
      const y = MIN_PCT + rand() * (MAX_PCT - MIN_PCT)
      if (isInCardZone(x, y)) continue
      const minDist = points.length === 0
        ? Infinity
        : points.reduce((min, p) => Math.min(min, aspectDistance(x, y, p.x, p.y)), Infinity)
      if (minDist > bestScore) {
        bestScore = minDist
        best = { x, y }
      }
    }
    if (best) points.push(best)
  }
  return points
}

type FloatingBall = {
  sprite: (typeof BALL_SPRITES)[number]
  left: number
  top: number
  size: number
  rotate: number
  duration: number
  delay: number
  depth: number
  mobile: boolean
}

const FLOATING_BALLS: FloatingBall[] = (() => {
  const rand = seededRandom(20260925)
  const positions = bestCandidateSample(rand, POINT_COUNT)

  // Seeded shuffle of the sprite order for a balanced round-robin assignment.
  const spriteOrder = [...BALL_SPRITES]
  for (let i = spriteOrder.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = spriteOrder[i]
    spriteOrder[i] = spriteOrder[j]
    spriteOrder[j] = tmp
  }

  return positions.map((pos, i) => {
    const depth = Math.round(rand() * 100) / 100
    // Rotate the starting offset each full cycle so neighbouring points
    // (which tend to land in different cycles) rarely repeat the same sprite.
    const rotatedIndex = (i + Math.floor(i / spriteOrder.length)) % spriteOrder.length
    return {
      sprite: spriteOrder[rotatedIndex],
      left: Math.round(pos.x * 10) / 10,
      top: Math.round(pos.y * 10) / 10,
      size: Math.round(48 + depth * 84),
      rotate: Math.round(rand() * 360),
      duration: Math.round(7 + rand() * 7),
      delay: -Math.round(rand() * 10),
      depth,
      mobile: i < MOBILE_VISIBLE_COUNT,
    }
  })
})()

const FLOAT_KEYFRAMES = `
@keyframes registro-float {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--ball-rotate)); }
  50% { transform: translate3d(0, -22px, 0) rotate(calc(var(--ball-rotate) + 14deg)); }
}
.registro-ball {
  animation: registro-float var(--ball-duration) ease-in-out infinite;
  animation-delay: var(--ball-delay);
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .registro-ball { animation: none; transform: rotate(var(--ball-rotate)); }
}
`

function BallsBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{FLOAT_KEYFRAMES}</style>

      {/* Luces */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-sky-300/40 dark:bg-sky-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-300/30 dark:bg-emerald-500/10 blur-3xl" />

      {/* Líneas de cancha */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke="white" strokeWidth="3">
          <rect x="60" y="60" width="1080" height="680" rx="6" />
          <line x1="600" y1="60" x2="600" y2="740" />
          <circle cx="600" cy="400" r="110" />
          <rect x="60" y="230" width="170" height="340" />
          <rect x="970" y="230" width="170" height="340" />
          <rect x="60" y="320" width="60" height="160" />
          <rect x="1080" y="320" width="60" height="160" />
        </g>
        <circle cx="600" cy="400" r="6" fill="white" />
      </svg>

      {FLOATING_BALLS.map((ball, i) => {
        const far = ball.depth < 0.35
        const style = {
          left: `${ball.left}%`,
          top: `${ball.top}%`,
          width: ball.size,
          height: ball.size,
          marginLeft: -ball.size / 2,
          marginTop: -ball.size / 2,
          opacity: 0.5 + ball.depth * 0.5,
          filter: far
            ? 'blur(2px)'
            : `drop-shadow(0 ${Math.round(6 + ball.depth * 10)}px ${Math.round(10 + ball.depth * 14)}px rgba(15, 23, 42, 0.35))`,
          '--ball-rotate': `${ball.rotate}deg`,
          '--ball-duration': `${ball.duration}s`,
          '--ball-delay': `${ball.delay}s`,
        } as CSSProperties
        return (
          <div key={i} className={`registro-ball absolute ${ball.mobile ? '' : 'hidden sm:block'}`} style={style}>
            <Image
              src={`/registro/${ball.sprite}.webp`}
              alt=""
              width={160}
              height={160}
              className="h-full w-full object-contain select-none"
              draggable={false}
            />
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Overlay de bienvenida: se muestra un instante tras crear la cuenta, antes de
// redirigir. Valores de la explosión de "confetti" deterministas (sin
// Math.random en el render) para que el resultado sea estable.
// ---------------------------------------------------------------------------

const WELCOME_BURST_SPRITES = ['soccer', 'basketball', 'tennis', 'padel'] as const

const WELCOME_BURST_ITEMS = [
  { angle: 0, distance: 130, size: 34, delay: 0 },
  { angle: 45, distance: 150, size: 28, delay: 0.05 },
  { angle: 90, distance: 120, size: 24, delay: 0.1 },
  { angle: 135, distance: 145, size: 30, delay: 0.02 },
  { angle: 180, distance: 135, size: 26, delay: 0.08 },
  { angle: 225, distance: 150, size: 32, delay: 0.03 },
  { angle: 270, distance: 125, size: 28, delay: 0.12 },
  { angle: 315, distance: 140, size: 30, delay: 0.06 },
].map((item, i) => ({
  ...item,
  sprite: WELCOME_BURST_SPRITES[i % WELCOME_BURST_SPRITES.length],
  x: Math.round(Math.cos((item.angle * Math.PI) / 180) * item.distance),
  y: Math.round(Math.sin((item.angle * Math.PI) / 180) * item.distance),
}))

const WELCOME_KEYFRAMES = `
@keyframes registro-welcome-logo-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes registro-welcome-fade-up {
  0% { transform: translateY(16px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes registro-welcome-burst {
  0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translate(calc(-50% + var(--burst-x)), calc(-50% + var(--burst-y))) scale(1); opacity: 0; }
}
@keyframes registro-welcome-progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
.registro-welcome-logo {
  animation: registro-welcome-logo-pop 0.6s ease-out both;
}
.registro-welcome-heading {
  animation: registro-welcome-fade-up 0.6s ease-out 0.25s both;
}
.registro-welcome-subtitle {
  animation: registro-welcome-fade-up 0.6s ease-out 0.45s both;
}
.registro-welcome-burst {
  left: 50%;
  top: 50%;
  animation: registro-welcome-burst 1.1s ease-out both;
  animation-delay: var(--burst-delay);
}
.registro-welcome-progress {
  animation: registro-welcome-progress 2.6s linear both;
}
@media (prefers-reduced-motion: reduce) {
  .registro-welcome-logo,
  .registro-welcome-heading,
  .registro-welcome-subtitle {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .registro-welcome-burst {
    display: none;
  }
  .registro-welcome-progress {
    animation: none;
    width: 100%;
  }
}
`

function WelcomeOverlay({ name }: { name: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-gradient-to-br from-sky-400 via-primary to-blue-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-950"
    >
      <style>{WELCOME_KEYFRAMES}</style>
      <BallsBackground />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {WELCOME_BURST_ITEMS.map((item, i) => (
          <div
            key={i}
            className="registro-welcome-burst absolute"
            style={{
              width: item.size,
              height: item.size,
              '--burst-x': `${item.x}px`,
              '--burst-y': `${item.y}px`,
              '--burst-delay': `${item.delay}s`,
            } as CSSProperties}
          >
            <Image
              src={`/registro/${item.sprite}.webp`}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-contain select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm w-full">
        <div className="registro-welcome-logo mb-6">
          <Image
            src="/logo.png"
            alt=""
            width={120}
            height={120}
            className="w-24 h-24 object-contain"
            priority
          />
        </div>
        <h1 className="registro-welcome-heading text-3xl sm:text-4xl font-extrabold text-white">
          ¡Te damos la bienvenida, {name}!
        </h1>
        <p className="registro-welcome-subtitle mt-3 text-white/80 text-base">
          Tu cuenta ya está lista. Estamos preparando todo para vos…
        </p>
        <div aria-hidden="true" className="mt-10 w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="registro-welcome-progress h-full bg-white rounded-full" />
        </div>
      </div>
    </div>
  )
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
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [welcomeName, setWelcomeName] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

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

  // Live list of unmet password requirements, shown while typing.
  const passwordIssues: string[] = []
  if (password.length < 8) passwordIssues.push('Debe tener al menos 8 caracteres')
  if (!/\p{L}/u.test(password)) passwordIssues.push('Debe contener al menos una letra')
  if (!/\d/.test(password)) passwordIssues.push('Debe contener al menos un número')
  // bcrypt limit; rare enough that the hint does not mention it.
  if (password.length > 72) passwordIssues.push('La contraseña es demasiado larga')

  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {}
    if (passwordIssues.length > 0) {
      errors.password = passwordIssues.join('. ')
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
        const targetRoute = getDefaultRouteForRole(newUser.role)
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const delay = reducedMotion ? 1200 : 2600
        setWelcomeName(nombre.trim())
        redirectTimeoutRef.current = setTimeout(() => {
          window.location.replace(targetRoute)
        }, delay)
      }
    }
  }

  const showAsistenciaForError = error
    ? /ya est[aá] en uso|no est[aá] disponible en este momento/i.test(error)
    : false

  const animationClass = direction === 'forward' ? 'animate-fade-in' : 'animate-fade-in'

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
            Crear cuenta de <span className="text-primary">jugador</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 text-center">
            Sumate al club en menos de un minuto
          </p>
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
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Fecha de nacimiento
                </span>
                <DatePicker
                  value={fechaNacimiento}
                  onChange={setFechaNacimiento}
                  placeholder="Elegí año, mes y día"
                  hasError={!!step2Errors.fechaNacimiento}
                  size="lg"
                />
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
                    placeholder="Mínimo 8 caracteres, con letra y número"
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
                {(password.length > 0 || step4Errors.password) && passwordIssues.length > 0 && (
                  <ul className="space-y-1 ml-1" aria-live="polite">
                    {passwordIssues.map((issue) => (
                      <li key={issue} className="flex items-center gap-1.5 text-sm text-red-500">
                        <span className="material-symbols-outlined text-base">error</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                )}
                {password.length > 0 && passwordIssues.length === 0 && (
                  <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 ml-1">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Contraseña válida
                  </p>
                )}
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

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => goToStep(4, 'back')}
                  disabled={isLoading}
                  className="sm:flex-1 bg-white dark:bg-slate-800 border-2 border-primary/30 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold py-3.5 whitespace-nowrap rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleCrearCuenta}
                  disabled={isLoading}
                  className="sm:flex-[2] bg-gradient-to-r from-blue-600 to-primary disabled:from-blue-600/50 disabled:to-primary/50 disabled:cursor-not-allowed text-white font-bold py-3.5 whitespace-nowrap text-base rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
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

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-3">
            &iquest;Ya ten&eacute;s cuenta?{' '}
            <a href="/login" className="text-primary font-bold hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>

        <div className="h-2 w-full bg-primary grass-gradient"></div>
      </div>

      {welcomeName && <WelcomeOverlay name={welcomeName} />}
    </div>
  )
}
