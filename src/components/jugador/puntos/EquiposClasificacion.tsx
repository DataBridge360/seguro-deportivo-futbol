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
    box: 'mt-0 border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-md dark:from-amber-500/15 dark:to-slate-800',
    logo: 'size-20 border-2 border-white ring-[3px] ring-amber-400',
    name: 'font-extrabold',
    btn: 'border-amber-500 bg-amber-500 text-white hover:bg-amber-600',
  },
  {
    badge: 'bg-slate-300 text-slate-900',
    box: 'mt-8 border-slate-400 bg-white dark:bg-slate-800',
    logo: 'size-16 border-2 border-white ring-[3px] ring-slate-400',
    name: 'font-bold',
    btn: 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  },
  {
    badge: 'bg-orange-500 text-white',
    box: 'mt-8 border-orange-600/70 bg-orange-50/40 dark:border-orange-500/70 dark:bg-orange-500/10',
    logo: 'size-16 border-2 border-white ring-[3px] ring-orange-500',
    name: 'font-bold',
    btn: 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600',
  },
]

// Round plus button used to support a team
function ApoyarButton({
  equipo,
  onApoyar,
  className,
}: {
  equipo: RankingEquipoPuntos
  onApoyar: (e: RankingEquipoPuntos) => void
  className: string
}) {
  return (
    <button
      type="button"
      onClick={() => onApoyar(equipo)}
      aria-label={`Apoyar a ${equipo.equipo_nombre}`}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-95 ${className}`}
    >
      <span className="material-symbols-outlined text-2xl font-bold" aria-hidden>
        add
      </span>
    </button>
  )
}

const SOFT_BTN =
  'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'

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
      className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 px-2 pb-3 pt-4 text-center transition-all duration-500 ${s.box} ${
        highlight ? 'ring-4 ring-emerald-400' : ''
      }`}
    >
      <div className="relative mb-1.5">
        <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className={s.logo} />
        <span
          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-xs font-extrabold ring-2 ring-white dark:ring-slate-800 ${s.badge}`}
        >
          {equipo.posicion}°
        </span>
      </div>
      <p
        className={`line-clamp-2 min-h-[2.5rem] w-full break-words text-base leading-5 text-slate-900 dark:text-white ${s.name}`}
      >
        {equipo.equipo_nombre}
      </p>
      <p className="text-base font-bold tabular-nums text-slate-700 dark:text-slate-200">
        <AnimatedNumber value={equipo.total} /> <span className="text-xs font-semibold">pts</span>
      </p>
      <ApoyarButton equipo={equipo} onApoyar={onApoyar} className={s.btn} />
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
  // Visual order is 2nd, 1st, 3rd
  const order = [1, 0, 2].filter(i => equipos[i])
  const single = equipos.length === 1
  const cols = equipos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={single ? 'flex justify-center' : `grid ${cols} items-start gap-2.5`}>
      {order.map(i => (
        <div key={equipos[i].torneo_equipo_id} className={`min-w-0 ${single ? 'w-full max-w-[12rem]' : ''}`}>
          <PodiumItem
            equipo={equipos[i]}
            place={i}
            highlight={highlightId === equipos[i].torneo_equipo_id}
            onApoyar={onApoyar}
          />
        </div>
      ))}
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
      className={`flex items-center gap-3 py-3 transition-colors duration-500 ${
        highlight ? 'bg-emerald-50 dark:bg-emerald-500/15' : ''
      }`}
    >
      <div className="relative shrink-0">
        <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-12" />
        <span className="absolute -bottom-1 -left-1 flex size-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white ring-2 ring-white dark:bg-slate-200 dark:text-slate-900 dark:ring-slate-900">
          {equipo.posicion}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
        {equipo.categoria_nombre && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{equipo.categoria_nombre}</p>
        )}
      </div>
      <p className="shrink-0 text-base font-bold tabular-nums text-slate-800 dark:text-slate-100">
        <AnimatedNumber value={equipo.total} /> <span className="text-xs font-semibold">pts</span>
      </p>
      <ApoyarButton equipo={equipo} onApoyar={onApoyar} className={SOFT_BTN} />
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
  const top = torneo.equipos.slice(0, 3)
  const rest = torneo.equipos.slice(3)
  return (
    <section
      aria-label={torneo.torneo_nombre}
      className="w-full shrink-0 snap-center snap-always space-y-3 self-start px-2"
    >
      {torneo.equipos.length === 0 ? (
        <p className="py-6 text-center text-base text-slate-600 dark:text-slate-300">Todavía no hay equipos en este torneo</p>
      ) : (
        <>
          <Podium equipos={top} highlightId={highlightId} onApoyar={onApoyar} />
          {rest.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Resto de los equipos
              </h2>
              <ul className="mt-1 divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                {rest.map(e => (
                  <Row key={e.torneo_equipo_id} equipo={e} highlight={highlightId === e.torneo_equipo_id} onApoyar={onApoyar} />
                ))}
              </ul>
            </div>
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

      <p className="text-base text-slate-600 dark:text-slate-300">
        Dale puntos en forma de apoyo y ayudalo a ganar premios del club
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
