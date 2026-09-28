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
const BORDER_GLOW_TRANSITION = 'opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), background-position 500ms cubic-bezier(0.22, 1, 0.36, 1)'
// Subtle glow at rest, brighter while the pointer drives the tilt.
const BORDER_GLOW_REST_OPACITY = '0.45'
const BORDER_GLOW_ACTIVE_OPACITY = '0.95'

const DATA_ITEM_DELAY_MS = 90

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
  const borderGlowRef = useRef<HTMLDivElement>(null)
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
      glare.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(224,242,254,0.4), rgba(224,242,254,0) 55%)`
      glare.style.opacity = '0.3'
    }

    const sheen = sheenRef.current
    if (sheen) {
      sheen.style.backgroundPosition = `${px * 100}% ${py * 100}%`
      sheen.style.opacity = '1'
    }

    const borderGlow = borderGlowRef.current
    if (borderGlow) {
      borderGlow.style.transition = 'none'
      borderGlow.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.95), rgba(125,211,252,0.5) 45%, rgba(255,255,255,0.08) 75%)`
      borderGlow.style.opacity = BORDER_GLOW_ACTIVE_OPACITY
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
    const borderGlow = borderGlowRef.current
    if (borderGlow) {
      borderGlow.style.transition = BORDER_GLOW_TRANSITION
      borderGlow.style.background = 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.7), rgba(125,211,252,0.35) 45%, rgba(255,255,255,0.05) 75%)'
      borderGlow.style.opacity = BORDER_GLOW_REST_OPACITY
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
      className="relative overflow-visible text-white w-full min-h-[240px] sm:min-h-[230px] rounded-[24px] ring-1 ring-white/15 select-none"
      style={{
        // Dragging on the card only tilts it; the browser must not scroll the
        // page (pan-y let it scroll and cancel the gesture mid-drag).
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        willChange: 'transform',
        boxShadow: '0 24px 48px -14px rgba(19, 146, 236, 0.5), 0 10px 20px -10px rgba(11, 31, 77, 0.55)',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {/* Background gradient, light burst, watermark, sheen and glare */}
      <div
        className="absolute inset-0 rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0b1f4d 0%, #0c3a7a 45%, #1392ec 100%)',
        }}
      >
        {/* Soft light burst, top-right */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(125,211,252,0.45), rgba(125,211,252,0) 55%)',
          }}
        />

        {/* Faint oversized club logo watermark, cropped bottom-right */}
        <div aria-hidden className="absolute pointer-events-none right-[-40px] bottom-[-40px]">
          <Image
            src="/logo.png"
            alt=""
            width={420}
            height={420}
            className="opacity-[0.09]"
            style={{ filter: 'brightness(2) grayscale(0.3)' }}
          />
        </div>

        {/* Holographic sheen */}
        <div
          ref={sheenRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0,
            mixBlendMode: 'overlay',
            backgroundImage:
              'linear-gradient(115deg, transparent 20%, rgba(224,242,254,0.4) 40%, rgba(224,242,254,0.08) 50%, transparent 65%)',
            backgroundSize: '250% 250%',
            backgroundPosition: '50% 50%',
          }}
        />

        {/* Pointer-tracking glare */}
        <div
          ref={glareRef}
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0 }}
        />
      </div>

      {/* Glowing border ring, brightness follows the pointer while tilting */}
      <div
        ref={borderGlowRef}
        aria-hidden
        className="absolute inset-0 rounded-[24px] pointer-events-none"
        style={{
          padding: '1px',
          opacity: BORDER_GLOW_REST_OPACITY,
          transition: BORDER_GLOW_TRANSITION,
          background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.7), rgba(125,211,252,0.35) 45%, rgba(255,255,255,0.05) 75%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Card content */}
      <div className="relative z-10 h-full p-4 sm:p-5 flex flex-col gap-4">
        {/* Header - caption, name and QR button */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-white/60 font-semibold">
              Credencial digital
            </p>
            <h1 className="mt-0.5 text-[26px] sm:text-3xl font-bold leading-tight tracking-tight line-clamp-2 break-words">
              {name}
            </h1>
          </div>
          <button
            onClick={onShowQR}
            className="shrink-0 mt-0.5 flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg font-bold border border-white/25 hover:bg-white/25 transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            VER QR
          </button>
        </div>

        {/* Data, appearing one after another */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div
            className="motion-reduce:animate-none animate-card-item"
            style={{ animationDelay: `${DATA_ITEM_DELAY_MS * 0}ms` }}
          >
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-white/60">DNI</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums">{dni}</p>
          </div>
          <div
            className="motion-reduce:animate-none animate-card-item"
            style={{ animationDelay: `${DATA_ITEM_DELAY_MS * 1}ms` }}
          >
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-white/60">Nacimiento</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums">{birthDate}</p>
          </div>
          <div
            className="col-span-2 pt-3 border-t border-white/15 motion-reduce:animate-none animate-card-item"
            style={{ animationDelay: `${DATA_ITEM_DELAY_MS * 2}ms` }}
          >
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-white/60">Vigencia del Seguro</p>
            <p className="text-base sm:text-lg font-semibold tabular-nums truncate">
              {insuranceStart} - {insuranceEnd}
            </p>
          </div>
          <div
            className="col-span-2 motion-reduce:animate-none animate-card-item"
            style={{ animationDelay: `${DATA_ITEM_DELAY_MS * 3}ms` }}
          >
            {status === 'activo' ? (
              <span className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                <span className="size-1.5 rounded-full bg-green-400" />
                PAGADO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 text-red-300 text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
                <span className="size-1.5 rounded-full bg-red-400" />
                NO PAGADO
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
