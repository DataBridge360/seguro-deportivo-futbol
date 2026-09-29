'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { RankingEquipoPuntos, RankingTorneoPuntos } from '@/lib/api'
import { useRankingStream } from '@/hooks/useRankingStream'
import { fmt, primaryBtnCls } from '@/components/club/puntos/ui'
import BackToPuntos from './BackToPuntos'
import TeamLogo from './TeamLogo'

// Counts from the previous value to the new one so live changes are noticeable
function AnimatedNumber({ value }: { value: number }) {
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

function PodiumSpot({ equipo, place, highlight }: { equipo: RankingEquipoPuntos; place: number; highlight: boolean }) {
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
      <p className="text-base font-extrabold text-primary dark:text-sky-300">
        <AnimatedNumber value={equipo.total} />
      </p>
    </div>
  )
}

function TorneoSlide({ torneo, highlightId }: { torneo: RankingTorneoPuntos; highlightId: string | null }) {
  const top = torneo.equipos.slice(0, 3)
  const rest = torneo.equipos.slice(3)
  // Visual order: 2nd, 1st, 3rd
  const order = [1, 0, 2].filter(i => top[i])

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{torneo.torneo_nombre}</h2>
      {torneo.equipos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
          Todavía no hay equipos en este torneo
        </p>
      ) : (
        <>
          <div className="flex items-end gap-2">
            {order.map(i => (
              <PodiumSpot key={top[i].torneo_equipo_id} equipo={top[i]} place={Math.min(i, 2)} highlight={highlightId === top[i].torneo_equipo_id} />
            ))}
          </div>
          {rest.length > 0 && (
            <ul className="space-y-2">
              {rest.map(e => (
                <li
                  key={e.torneo_equipo_id}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border p-2 transition-all duration-500 ${
                    highlightId === e.torneo_equipo_id
                      ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-300 dark:bg-emerald-500/15'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                    {e.posicion}°
                  </span>
                  <TeamLogo src={e.equipo_logo_url} name={e.equipo_nombre} className="size-12" />
                  <div className="min-w-0 flex-1">
                    {e.categoria_nombre && (
                      <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{e.categoria_nombre}</p>
                    )}
                    <p className="truncate text-base font-bold text-slate-900 dark:text-white">{e.equipo_nombre}</p>
                  </div>
                  <p className="shrink-0 text-base font-extrabold text-primary dark:text-sky-300">
                    <AnimatedNumber value={e.total} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default function TablaEnVivo() {
  const { ranking, status, highlightId } = useRankingStream()
  const params = useSearchParams()
  const wantedTorneo = params.get('torneo')
  const sliderRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const positioned = useRef(false)
  const torneos = ranking?.torneos ?? []

  const goTo = useCallback((i: number, smooth = true) => {
    const el = sliderRef.current
    const slide = el?.children[i] as HTMLElement | undefined
    if (!el || !slide) return
    el.scrollTo({ left: slide.offsetLeft - el.offsetLeft, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    if (positioned.current || !ranking) return
    positioned.current = true
    const idx = ranking.torneos.findIndex(t => t.torneo_id === wantedTorneo)
    if (idx > 0) {
      goTo(idx, false)
      const raf = requestAnimationFrame(() => setActive(idx))
      return () => cancelAnimationFrame(raf)
    }
  }, [ranking, wantedTorneo, goTo])

  const onScroll = () => {
    const el = sliderRef.current
    if (!el || el.children.length === 0) return
    const first = el.children[0] as HTMLElement
    const step = first.offsetWidth + 12
    setActive(Math.max(0, Math.min(el.children.length - 1, Math.round(el.scrollLeft / step))))
  }

  const live = status === 'live'

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToPuntos />

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b3a63] to-[#1392ec] px-5 py-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Tabla en vivo</h1>
          <span
            role="status"
            className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold"
          >
            <span className="relative flex size-3">
              {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex size-3 rounded-full ${live ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </span>
            {live ? 'En vivo' : 'Reconectando…'}
          </span>
        </div>
        <p className="mt-2 text-base text-white/90">El club entrega premios a los mejores equipos.</p>
      </div>

      {!ranking ? (
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" aria-hidden />
      ) : torneos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
          No hay torneos en curso
        </p>
      ) : (
        <>
          {torneos.length > 1 && (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Torneos">
              {torneos.map((t, i) => (
                <button
                  key={t.torneo_id}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => {
                    setActive(i)
                    goTo(i)
                  }}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-base font-bold transition-colors ${
                    active === i
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  {t.torneo_nombre}
                </button>
              ))}
            </div>
          )}

          <div
            ref={sliderRef}
            onScroll={onScroll}
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2"
          >
            {torneos.map(t => (
              <div key={t.torneo_id} className={`shrink-0 snap-center ${torneos.length > 1 ? 'w-[88%]' : 'w-full'}`}>
                <TorneoSlide torneo={t} highlightId={highlightId} />
              </div>
            ))}
          </div>
        </>
      )}

      <Link href="/dashboard/jugador/puntos/apoyar" className={primaryBtnCls}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
          favorite
        </span>
        ¡Apoyá a tu equipo!
      </Link>
    </div>
  )
}
