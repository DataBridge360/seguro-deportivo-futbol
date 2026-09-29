'use client'

import { useEffect, useRef, useState } from 'react'
import type { RankingEquipoPuntos } from '@/lib/api'
import { fmt } from '@/components/club/puntos/ui'
import TeamLogo from './TeamLogo'

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

const PODIUM = [
  { ring: 'ring-amber-400', badge: 'bg-amber-400 text-amber-950', icon: 'text-amber-500', logo: 'size-20', box: 'pt-2' },
  { ring: 'ring-slate-300', badge: 'bg-slate-300 text-slate-900', icon: 'text-slate-400', logo: 'size-14', box: 'pt-8' },
  { ring: 'ring-orange-400', badge: 'bg-orange-400 text-orange-950', icon: 'text-orange-500', logo: 'size-14', box: 'pt-8' },
]

function PodiumSpot({
  equipo,
  place,
  highlight,
  onGive,
}: {
  equipo: RankingEquipoPuntos
  place: number
  highlight: boolean
  onGive: (e: RankingEquipoPuntos) => void
}) {
  const s = PODIUM[place]
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl p-2 text-center transition-shadow duration-500 ${s.box} ${
        highlight ? 'bg-emerald-100 ring-4 ring-emerald-400 dark:bg-emerald-500/20' : ''
      }`}
    >
      <span className={`material-symbols-outlined text-4xl ${s.icon}`} style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
        emoji_events
      </span>
      <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className={`${s.logo} ring-4 ${s.ring}`} />
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-extrabold ${s.badge}`}>{equipo.posicion}°</span>
      <p className="line-clamp-2 w-full text-base font-bold leading-tight text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
      <p className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
        <AnimatedNumber value={equipo.total} />
      </p>
      <button
        type="button"
        onClick={() => onGive(equipo)}
        aria-label={`Dar puntos a ${equipo.equipo_nombre}`}
        className="mt-1 flex min-h-11 items-center justify-center gap-1 rounded-full border border-rose-200 px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden>
          favorite
        </span>
        Dar puntos
      </button>
    </div>
  )
}

export default function Podio({
  equipos,
  highlightId,
  onGive,
}: {
  equipos: RankingEquipoPuntos[]
  highlightId: string | null
  onGive: (e: RankingEquipoPuntos) => void
}) {
  const top = equipos.slice(0, 3)
  // Visual order: 2nd, 1st, 3rd
  const order = [1, 0, 2].filter(i => top[i])
  return (
    <div className="flex items-end gap-2">
      {order.map(i => (
        <PodiumSpot
          key={top[i].torneo_equipo_id}
          equipo={top[i]}
          place={i}
          highlight={highlightId === top[i].torneo_equipo_id}
          onGive={onGive}
        />
      ))}
    </div>
  )
}
