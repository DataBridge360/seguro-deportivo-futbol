'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

export interface WalletCardProps {
  name: string
  dni: string
  birthDate: string
  insuranceStart: string
  insuranceEnd: string
  status: 'activo' | 'inactivo' | string
  onShowQR: () => void
}

const MAX_TILT_DEG = 12
// No scale-up while tilting: a scaled full-width card overflows the viewport
// horizontally and makes the whole page slide sideways on phones.
const ACTIVE_SCALE = 1
const RESET_TRANSITION = 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)'
const GLARE_TRANSITION = 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1)'

/**
 * Digital wallet-style credential card with pointer-driven 3D tilt and
 * glare/sheen reflections. Imperatively mutates the DOM via refs on every
 * pointer move (throttled through requestAnimationFrame) to avoid
 * re-rendering React on each frame.
 */
export default function WalletCard({
  name,
  dni,
  birthDate,
  insuranceStart,
  insuranceEnd,
  status,
  onShowQR,
}: WalletCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const latestPointRef = useRef<{ x: number; y: number } | null>(null)
  const reduceMotionRef = useRef(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotionRef.current = mql.matches

    const handleChange = (e: MediaQueryListEvent) => {
      reduceMotionRef.current = e.matches
      if (e.matches) {
        resetCard()
      }
    }

    mql.addEventListener('change', handleChange)
    return () => {
      mql.removeEventListener('change', handleChange)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const applyTransform = () => {
    rafRef.current = null
    const point = latestPointRef.current
    const card = cardRef.current
    if (!point || !card) return

    const rect = card.getBoundingClientRect()
    // Clamped: with pointer capture the finger can leave the card while dragging.
    const px = Math.min(1, Math.max(0, (point.x - rect.left) / rect.width))
    const py = Math.min(1, Math.max(0, (point.y - rect.top) / rect.height))

    const rotateY = (px - 0.5) * 2 * MAX_TILT_DEG
    const rotateX = -(py - 0.5) * 2 * MAX_TILT_DEG

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${ACTIVE_SCALE})`

    const glare = glareRef.current
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%)`
      glare.style.opacity = '0.35'
    }

    const sheen = sheenRef.current
    if (sheen) {
      sheen.style.backgroundPosition = `${px * 100}% ${py * 100}%`
      sheen.style.opacity = '1'
    }
  }

  const scheduleFrame = (x: number, y: number) => {
    latestPointRef.current = { x, y }
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyTransform)
    }
  }

  const resetCard = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    latestPointRef.current = null
    const card = cardRef.current
    if (card) {
      card.style.transition = RESET_TRANSITION
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
    }
    const glare = glareRef.current
    if (glare) {
      glare.style.transition = GLARE_TRANSITION
      glare.style.opacity = '0'
    }
    const sheen = sheenRef.current
    if (sheen) {
      sheen.style.transition = GLARE_TRANSITION
      sheen.style.opacity = '0'
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotionRef.current) return
    const target = e.target as HTMLElement
    if (target.closest('button')) return

    const card = cardRef.current
    if (card) {
      card.style.transition = 'none'
      // Keep receiving moves while the finger drags, even outside the card.
      card.setPointerCapture(e.pointerId)
    }
    scheduleFrame(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotionRef.current) return
    scheduleFrame(e.clientX, e.clientY)
  }

  const handlePointerEnd = () => {
    if (reduceMotionRef.current) return
    resetCard()
  }

  return (
    <div
      ref={cardRef}
      role="group"
      aria-label="Credencial digital"
      className="relative overflow-visible text-white w-full aspect-[1.586/1] min-h-[210px] sm:min-h-[220px] rounded-[24px] border border-white/10 select-none"
      style={{
        // Dragging on the card only tilts it; the browser must not scroll the
        // page (pan-y let it scroll and cancel the gesture mid-drag).
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        willChange: 'transform',
        boxShadow: '0 20px 40px -12px rgba(3, 105, 161, 0.55), 0 8px 16px -8px rgba(0,0,0,0.35)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      <div
        className="absolute inset-0 rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(3, 105, 161, 0.95) 100%)',
        }}
      >
        {/* Inner highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 30%)',
          }}
        />

        {/* Background club logo */}
        <div className="absolute pointer-events-none right-[-30px] bottom-[-30px]">
          <Image
            src="/logo.png"
            alt=""
            width={360}
            height={360}
            className="opacity-[0.12] rotate-12"
            style={{ filter: 'brightness(2) grayscale(0.3)' }}
          />
        </div>

        {/* Holographic sheen */}
        <div
          ref={sheenRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0,
            mixBlendMode: 'overlay',
            backgroundImage:
              'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.1) 50%, transparent 65%)',
            backgroundSize: '250% 250%',
            backgroundPosition: '50% 50%',
          }}
        />

        {/* Pointer-tracking glare */}
        <div
          ref={glareRef}
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Card content */}
      <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between gap-2">
        {/* Top section - Name */}
        <div className="flex justify-between items-start relative z-10 gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] sm:text-3xl font-bold leading-tight tracking-tight line-clamp-2 break-words">
              {name}
            </h1>
          </div>
        </div>

        {/* QR Button */}
        <div className="flex justify-end relative z-10">
          <button
            onClick={onShowQR}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-bold border border-white/30 hover:bg-white/30 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            VER QR
          </button>
        </div>

        {/* DNI and Birth date */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <p className="text-[10px] sm:text-xs opacity-60 uppercase font-bold tracking-wider">DNI</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums">{dni}</p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs opacity-60 uppercase font-bold tracking-wider">Nacimiento</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums">{birthDate}</p>
          </div>
        </div>

        {/* Separator and insurance validity */}
        <div className="pt-2 border-t border-white/20 flex items-center justify-between relative z-10 gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs opacity-60 uppercase font-bold tracking-wider">Vigencia del Seguro</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums truncate">
              {insuranceStart} - {insuranceEnd}
            </p>
          </div>
          {status === 'activo' ? (
            <span className="shrink-0 bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              PAGADO
            </span>
          ) : (
            <span className="shrink-0 bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              NO PAGADO
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
