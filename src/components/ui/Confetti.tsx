'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const COLORS = ['#F59E0B', '#1392ec', '#10B981', '#F43F5E', '#8B5CF6']
const PIECES = 150
const DURATION_MS = 3000
const GRAVITY = 0.32
const DRAG = 0.985

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  round: boolean
  color: string
  rot: number
  vrot: number
  wobble: number
  vwobble: number
}

function createPieces(width: number, height: number): Piece[] {
  const pieces: Piece[] = []
  for (let i = 0; i < PIECES; i++) {
    // Two cannons at the bottom corners-ish, aimed up and toward the center
    const fromLeft = i % 2 === 0
    const angle = (fromLeft ? -Math.PI / 2 + 0.35 : -Math.PI / 2 - 0.35) + (Math.random() - 0.5) * 0.9
    const speed = (10 + Math.random() * 12) * Math.min(1.4, Math.max(0.7, height / 800))
    const size = 6 + Math.random() * 6
    pieces.push({
      x: width * (fromLeft ? 0.3 : 0.7) + (Math.random() - 0.5) * 40,
      y: height + 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: size,
      h: Math.random() < 0.5 ? size : size * 0.5,
      round: Math.random() < 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      vwobble: 0.08 + Math.random() * 0.15,
    })
  }
  return pieces
}

// Full-screen confetti burst. Fires every time `fire` changes to a truthy value (use a counter to re-fire).
export default function Confetti({ fire }: { fire: number | boolean }) {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!fire) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setActive(n => n + 1)
  }, [fire])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const pieces = createPieces(width, height)
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, width, height)
      const fade = elapsed > DURATION_MS * 0.6 ? Math.max(0, 1 - (elapsed - DURATION_MS * 0.6) / (DURATION_MS * 0.4)) : 1

      for (const p of pieces) {
        p.vx *= DRAG
        p.vy = p.vy * DRAG + GRAVITY
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot
        p.wobble += p.vwobble

        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.scale(1, Math.cos(p.wobble))
        ctx.fillStyle = p.color
        if (p.round) {
          ctx.beginPath()
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }
        ctx.restore()
      }

      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, width, height)
      }
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      ctx.clearRect(0, 0, width, height)
    }
  }, [active])

  if (!mounted || !active) return null

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] size-full"
    />,
    document.body
  )
}
