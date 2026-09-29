'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { RankingEquipoPuntos } from '@/lib/api'
import { useRankingStream } from '@/hooks/useRankingStream'
import { fmt } from '@/components/club/puntos/ui'
import DarPuntosModal from './DarPuntosModal'
import Podio, { AnimatedNumber } from './Podio'
import TeamLogo from './TeamLogo'

function EquipoRow({
  equipo,
  highlight,
  onGive,
}: {
  equipo: RankingEquipoPuntos
  highlight: boolean
  onGive: (e: RankingEquipoPuntos) => void
}) {
  return (
    <li
      className={`flex items-center gap-3 py-3 transition-colors duration-500 ${
        highlight ? 'bg-emerald-50 dark:bg-emerald-500/15' : ''
      }`}
    >
      <span className="w-8 shrink-0 text-center text-base font-extrabold text-slate-600 dark:text-slate-300">{equipo.posicion}°</span>
      <TeamLogo src={equipo.equipo_logo_url} name={equipo.equipo_nombre} className="size-11" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-slate-900 dark:text-white">{equipo.equipo_nombre}</p>
        <p className="text-base font-semibold tabular-nums text-slate-700 dark:text-slate-200">
          <AnimatedNumber value={equipo.total} /> puntos
        </p>
        {equipo.categoria_nombre && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{equipo.categoria_nombre}</p>}
      </div>
      <button
        type="button"
        onClick={() => onGive(equipo)}
        aria-label={`Dar puntos a ${equipo.equipo_nombre}`}
        className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-rose-200 px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
      >
        <span className="material-symbols-outlined text-lg" aria-hidden>
          favorite
        </span>
        Dar puntos
      </button>
    </li>
  )
}

export default function PuntosEquiposSection({
  variant,
  saldo,
  onSaldoChange,
}: {
  variant: 'full' | 'compact'
  saldo?: number
  onSaldoChange?: (n: number) => void
}) {
  const { ranking, status, highlightId } = useRankingStream()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [target, setTarget] = useState<RankingEquipoPuntos | null>(null)
  // Balance known after a gift, valid only while the prop it was based on is unchanged
  const [override, setOverride] = useState<{ base: number | undefined; value: number } | null>(null)
  const [wanted] = useState(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('torneo')
  )

  const torneos = ranking?.torneos ?? []
  const torneo =
    torneos.find(t => t.torneo_id === selectedId) ?? torneos.find(t => t.torneo_id === wanted) ?? torneos[0] ?? null
  const currentSaldo = override && override.base === saldo ? override.value : saldo
  const live = status === 'live'
  const equipos = torneo?.equipos ?? []
  const fourth = equipos[3]
  const rest = equipos.slice(4)

  const handleDone = (n: number) => {
    setOverride({ base: saldo, value: n })
    onSaldoChange?.(n)
  }

  return (
    <section aria-labelledby="equipos-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="equipos-title" className="text-xl font-bold text-slate-900 dark:text-white">
          Puntos de equipos
        </h2>
        <span role="status" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="relative flex size-2.5">
            {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex size-2.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          {live ? 'En vivo' : 'Reconectando…'}
        </span>
      </div>

      <p className="flex items-start gap-2 text-base text-slate-600 dark:text-slate-300">
        <span className="material-symbols-outlined shrink-0 text-xl text-slate-500" aria-hidden>
          info
        </span>
        <span>
          {variant === 'full'
            ? 'Son puntos que la gente regala a los equipos. No cuentan para el torneo: el club entrega premios a los equipos que más puntos juntan.'
            : 'Regalá puntos a los equipos: el club premia a los que más juntan. No cuentan para el torneo.'}
        </span>
      </p>

      {!ranking ? (
        <div className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" aria-hidden />
      ) : torneos.length === 0 || !torneo ? (
        <p className="py-4 text-center text-base text-slate-600 dark:text-slate-300">
          Cuando haya torneos en curso vas a poder regalarles puntos a los equipos.
        </p>
      ) : (
        <>
          {torneos.length > 1 && (
            <div
              className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 dark:border-slate-700"
              role="tablist"
              aria-label="Torneos"
            >
              {torneos.map(t => {
                const active = t.torneo_id === torneo.torneo_id
                return (
                  <button
                    key={t.torneo_id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedId(t.torneo_id)
                      setExpanded(false)
                    }}
                    className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 text-base font-semibold transition-colors ${
                      active
                        ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.torneo_nombre}
                  </button>
                )
              })}
            </div>
          )}

          {torneos.length === 1 && <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{torneo.torneo_nombre}</p>}

          {equipos.length === 0 ? (
            <p className="py-4 text-center text-base text-slate-600 dark:text-slate-300">Todavía no hay equipos en este torneo</p>
          ) : (
            <>
              <Podio equipos={equipos} highlightId={highlightId} onGive={setTarget} />

              {variant === 'full' && (
                <>
                  {(fourth || rest.length > 0) && (
                    <ul className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-700 dark:border-slate-700">
                      {fourth && (
                        <EquipoRow equipo={fourth} highlight={highlightId === fourth.torneo_equipo_id} onGive={setTarget} />
                      )}
                      {expanded &&
                        rest.map(e => (
                          <EquipoRow key={e.torneo_equipo_id} equipo={e} highlight={highlightId === e.torneo_equipo_id} onGive={setTarget} />
                        ))}
                    </ul>
                  )}
                  {rest.length > 0 && (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpanded(v => !v)}
                      className="mx-auto flex min-h-11 items-center gap-1 px-3 text-base font-semibold text-slate-700 hover:underline dark:text-slate-200"
                    >
                      {expanded ? 'Ver menos' : `Ver más (${fmt(rest.length)})`}
                      <span className="material-symbols-outlined" aria-hidden>
                        {expanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {variant === 'compact' && (
            <Link
              href={`/dashboard/jugador/puntos?torneo=${encodeURIComponent(torneo.torneo_id)}#equipos`}
              className="mx-auto flex min-h-11 items-center justify-center gap-1 text-base font-semibold text-slate-800 hover:underline dark:text-slate-100"
            >
              Ver todos y dar puntos
              <span className="material-symbols-outlined" aria-hidden>
                chevron_right
              </span>
            </Link>
          )}
        </>
      )}

      {target && (
        <DarPuntosModal equipo={target} saldo={currentSaldo} onClose={() => setTarget(null)} onDone={handleDone} />
      )}
    </section>
  )
}
