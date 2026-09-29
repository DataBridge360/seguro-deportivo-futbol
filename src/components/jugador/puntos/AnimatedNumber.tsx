'use client'

import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/components/club/puntos/ui'

// Counts from the previous value to the new one so live changes are noticeable
export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const fromRef = useRef(value)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      const next = Math.round(from + (value - from) * t)
      fromRef.current = next
      setShown(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{fmt(shown)}</>
}
