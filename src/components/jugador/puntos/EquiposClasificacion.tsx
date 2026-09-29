'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getApoyarPuntos, type RankingEquipoPuntos, type RankingTorneoPuntos } from '@/lib/api'
import { useRankingStream } from '@/hooks/useRankingStream'
import { fmt } from '@/components/club/puntos/ui'
import ApoyarEquipoModal from './ApoyarEquipoModal'
import { AnimatedNumber } from './AnimatedNumber'
import TeamLogo from './TeamLogo'

// Index is the place (0 = first)
const PODIUM = [
  {
    badge: 'bg-amber-500 text-white',
    box: 'border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-4 shadow-md dark:from-amber-500/15 dark:to-slate-800',
    logo: 'size-20 border-2 border-amber-400',
    name: 'text-lg',
    pts: 'text-base',
    btn: 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500',
  },
  {
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100',
    box: 'border-2 border-slate-400 bg-white p-3 shadow-sm dark:border-slate-400 dark:bg-slate-800',
    logo: 'size-16 border-2 border-slate-400',
    name: 'text-base',
    pts: 'text-sm',
    btn: 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 dark:hover:bg-slate-600',
  },
  {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
    box: 'border-2 border-orange-600 bg-white p-3 shadow-sm dark:border-orange-500 dark:bg-slate-800',
    logo: 'size-16 border-2 border-orange-600',
    name: 'text-base',
    pts: 'text-sm',
    btn: 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500 dark:hover:bg-slate-600',
  },
]

function ApoyarIcon() {
  return (
    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
      favorite
    </span>
  )
}

function PodiumItem({
  equipo,
  place,
  highlight,
  onApoyar,
}: {
  equipo: RankingEquipoPuntos
  place: number
  highlight: boolean
  onApoyar: (e: RankingEquipoPuntos) => void
}) {
  const s = PODIUM[place]
  return (
    <article
      className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl text-center transition-all duration-500 ${s.box} ${
        highlight ? 'ring-4 ring-emerald-400' : ''
      }`}
    >
      <span className={`rounded-full px-2.5 py-0.5 text-sm font-extrabold ${s.badge}`}>{equipo.posicion}°</span>
      <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className={s.logo} />
      <p className={`line-clamp-2 w-full break-words font-bold leading-tight text-slate-900 dark:text-white ${s.name}`}>
        {equipo.equipo_nombre}
      </p>
      <p className={`font-semibold tabular-nums text-slate-600 dark:text-slate-300 ${s.pts}`}>
        <AnimatedNumber value={equipo.total} /> pts
      </p>
      <button
        type="button"
        onClick={() => onApoyar(equipo)}
        aria-label={`Apoyar a ${equipo.equipo_nombre}`}
        className={`mt-1 flex min-h-11 w-full items-center justify-center gap-1 rounded-full px-2 text-sm font-bold transition-colors ${s.btn}`}
      >
        <ApoyarIcon />
        Apoyar
      </button>
    </article>
  )
}

function Podium({
  equipos,
  highlightId,
  onApoyar,
}: {
  equipos: RankingEquipoPuntos[]
  highlightId: string | null
  onApoyar: (e: RankingEquipoPuntos) => void
}) {
  const top = equipos.slice(0, 3)
  const item = (i: number) => (
    <PodiumItem
      key={top[i].torneo_equipo_id}
      equipo={top[i]}
      place={i}
      highlight={highlightId === top[i].torneo_equipo_id}
      onApoyar={onApoyar}
    />
  )
  return (
    <div className="space-y-4">
      {top[0] && <div className="mx-auto w-full max-w-sm">{item(0)}</div>}
      {top[1] && (
        <div className="grid grid-cols-2 items-stretch gap-4">
          {item(1)}
          {top[2] && item(2)}
        </div>
      )}
    </div>
  )
}

function Row({
  equipo,
  highlight,
  onApoyar,
}: {
  equipo: RankingEquipoPuntos
  highlight: boolean
  onApoyar: (e: RankingEquipoPuntos) => void
}) {
  return (
    <li
      className={`flex items-center gap-3 py-2.5 transition-colors duration-500 ${
        highlight ? 'bg-emerald-50 dark:bg-emerald-500/15' : ''
      }`}
    >
      <span className="w-8 shrink-0 text-center text-base font-extrabold text-slate-500 dark:text-slate-300">{equipo.posicion}</span>
      <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
        <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {equipo.categoria_nombre && <span className="truncate">{equipo.categoria_nombre}</span>}
          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
            <AnimatedNumber value={equipo.total} /> pts
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => onApoyar(equipo)}
        aria-label={`Apoyar a ${equipo.equipo_nombre}`}
        className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <ApoyarIcon />
        Apoyar
      </button>
    </li>
  )
}

function Slide({
  torneo,
  highlightId,
  onApoyar,
}: {
  torneo: RankingTorneoPuntos
  highlightId: string | null
  onApoyar: (e: RankingEquipoPuntos) => void
}) {
  const rest = torneo.equipos.slice(3)
  return (
    <section
      aria-label={torneo.torneo_nombre}
      className="w-full shrink-0 snap-center snap-always space-y-3 self-start px-0.5"
    >
      {torneo.equipos.length === 0 ? (
        <p className="py-6 text-center text-base text-slate-600 dark:text-slate-300">Todavía no hay equipos en este torneo</p>
      ) : (
        <>
          <Podium equipos={torneo.equipos} highlightId={highlightId} onApoyar={onApoyar} />
          {rest.length > 0 && (
            <ul className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-700 dark:border-slate-700">
              {rest.map(e => (
                <Row key={e.torneo_equipo_id} equipo={e} highlight={highlightId === e.torneo_equipo_id} onApoyar={onApoyar} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default function EquiposClasificacion() {
  const { ranking, highlightId } = useRankingStream()
  const [picked, setPicked] = useState<string | null>(null)
  const [target, setTarget] = useState<RankingEquipoPuntos | null>(null)
  const [saldo, setSaldo] = useState<number | undefined>(undefined)
  const [wanted] = useState(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('torneo')
  )
  const scrollerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const lockUntil = useRef(0)
  const initialScrolled = useRef(false)

  const torneos = ranking?.torneos ?? []
  const activeId = picked ?? (torneos.find(t => t.torneo_id === wanted) ?? torneos[0])?.torneo_id ?? null
  const activeIndex = Math.max(
    0,
    torneos.findIndex(t => t.torneo_id === activeId)
  )
  const multi = torneos.length > 1

  useEffect(() => {
    let cancelled = false
    getApoyarPuntos()
      .then(r => {
        if (!cancelled) setSaldo(r.saldo)
      })
      .catch(() => {
        // The modal loads the balance itself when this is unknown
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Jump (without animation) to the requested torneo once slides exist
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || initialScrolled.current || torneos.length === 0) return
    initialScrolled.current = true
    el.scrollTo({ left: activeIndex * el.clientWidth, behavior: 'instant' })
  }, [torneos.length, activeIndex])

  // Keep the active tab visible in the scrollable segmented control
  useEffect(() => {
    const btn = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    btn?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeId])

  const onScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || Date.now() < lockUntil.current || el.clientWidth === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    const t = torneos[idx]
    if (t) setPicked(t.torneo_id)
  }, [torneos])

  const selectTorneo = (id: string, index: number) => {
    const el = scrollerRef.current
    setPicked(id)
    if (!el) return
    lockUntil.current = Date.now() + 600
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apoyá a tu equipo</h1>
      </div>

      <p className="flex items-start gap-2 text-base text-slate-600 dark:text-slate-300">
        <span className="material-symbols-outlined shrink-0 text-xl text-slate-500" aria-hidden>
          info
        </span>
        <span>
          Son puntos que la gente les da a los equipos en forma de apoyo. No cuentan para el torneo: el club premia a los
          equipos que más puntos juntan.
        </span>
      </p>

      {saldo !== undefined && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Tenés <span className="font-bold text-slate-900 dark:text-white">{fmt(saldo)}</span> puntos para dar en forma de apoyo
        </p>
      )}

      {!ranking ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" aria-hidden />
      ) : torneos.length === 0 ? (
        <p className="py-6 text-center text-base text-slate-600 dark:text-slate-300">
          Cuando haya torneos en curso vas a poder apoyar a los equipos.
        </p>
      ) : (
        <>
          {multi ? (
            <div
              ref={tabsRef}
              role="tablist"
              aria-label="Torneos"
              className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1 scrollbar-hide dark:bg-slate-800"
            >
              {torneos.map((t, i) => {
                const active = t.torneo_id === activeId
                return (
                  <button
                    key={t.torneo_id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectTorneo(t.torneo_id, i)}
                    className={`min-h-11 min-w-fit flex-1 whitespace-nowrap rounded-xl px-4 text-sm sm:text-base transition-colors ${
                      active
                        ? 'bg-white font-bold text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                        : 'font-semibold text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {t.torneo_nombre}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{torneos[0].torneo_nombre}</p>
          )}

          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory items-start overflow-x-auto scrollbar-hide"
          >
            {torneos.map(t => (
              <Slide key={t.torneo_id} torneo={t} highlightId={highlightId} onApoyar={setTarget} />
            ))}
          </div>
        </>
      )}

      {target && (
        <ApoyarEquipoModal
          equipo={target}
          saldo={saldo}
          onClose={() => setTarget(null)}
          onDone={n => setSaldo(n)}
        />
      )}
    </div>
  )
}
