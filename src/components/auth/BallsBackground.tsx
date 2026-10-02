'use client'

import { type CSSProperties } from 'react'
import Image from 'next/image'

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

export const FLOAT_KEYFRAMES = `
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

export default function BallsBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{FLOAT_KEYFRAMES}</style>

      {/* Luces: radial gradients instead of blur-3xl. Same look, but no filter
          for Safari to re-render on every frame of the theme View Transition. */}
      <div className="balls-light-sky absolute -top-64 -left-64 h-[40rem] w-[40rem]" />
      <div className="balls-light-emerald absolute -bottom-72 -right-56 h-[44rem] w-[44rem]" />

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
