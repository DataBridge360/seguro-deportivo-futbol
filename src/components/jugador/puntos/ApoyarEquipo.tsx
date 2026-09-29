'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getApoyarPuntos, type ApoyarPuntosResponse, type RankingEquipoPuntos } from '@/lib/api'
import { matchesSearch } from '@/lib/utils'
import { ErrorNote, errMsg, fmt, inputCls, primaryBtnCls } from '@/components/club/puntos/ui'
import ApoyarModal from './ApoyarModal'
import BackToPuntos from './BackToPuntos'
import TeamLogo from './TeamLogo'

export default function ApoyarEquipo() {
  const [data, setData] = useState<ApoyarPuntosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [torneoId, setTorneoId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<{ equipo: RankingEquipoPuntos; torneoId: string } | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      setData(await getApoyarPuntos())
    } catch (e) {
      setError(errMsg(e, 'No pudimos cargar los torneos.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const torneos = useMemo(() => data?.torneos ?? [], [data])
  const saldo = data?.saldo ?? 0
  const torneo = torneos.find(t => t.torneo_id === torneoId) ?? (torneos.length === 1 ? torneos[0] : null)
  const apoyos = useMemo(() => new Map((data?.mis_apoyos ?? []).map(a => [a.torneo_equipo_id, a.total])), [data])

  const equipos = useMemo(
    () => (torneo?.equipos ?? []).filter(e => matchesSearch([e.equipo_nombre, e.categoria_nombre], query)),
    [torneo, query]
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToPuntos />

      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b3a63] to-[#1392ec] px-5 py-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-rose-300" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
            favorite
          </span>
          <h1 className="text-2xl font-bold">¡Apoyá a tu equipo!</h1>
        </div>
        <p className="mt-3 text-3xl font-extrabold">{loading ? '…' : `Tenés ${fmt(saldo)} puntos`}</p>
        <p className="mt-2 text-base text-white/90">Elegí un torneo y un equipo. Podés apoyar a los equipos que quieras.</p>
      </div>

      <Link
        href="/dashboard/jugador/puntos/tabla"
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-base font-bold text-primary shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-slate-700/60"
      >
        <span className="material-symbols-outlined" aria-hidden>
          leaderboard
        </span>
        <span className="flex-1">Ver tabla en vivo</span>
        <span className="material-symbols-outlined text-slate-400" aria-hidden>
          chevron_right
        </span>
      </Link>

      {error && (
        <div className="space-y-3">
          <ErrorNote message={error} />
          <button type="button" onClick={() => load()} className={primaryBtnCls}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        data &&
        (torneos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
            No hay torneos en curso para apoyar
          </p>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Elegí el torneo</h2>
              <div className="flex flex-col gap-2" role="group" aria-label="Torneos">
                {torneos.map(t => {
                  const active = torneo?.torneo_id === t.torneo_id
                  return (
                    <button
                      key={t.torneo_id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setTorneoId(t.torneo_id)
                        setQuery('')
                      }}
                      className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-primary bg-primary/10 dark:bg-primary/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-primary dark:text-sky-300" aria-hidden>
                        {active ? 'radio_button_checked' : 'radio_button_unchecked'}
                      </span>
                      <span className="flex-1 text-base font-bold text-slate-900 dark:text-white">{t.torneo_nombre}</span>
                      <span className="text-base text-slate-600 dark:text-slate-300">{t.equipos.length} equipos</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {torneo && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Elegí el equipo</h2>
                {torneo.equipos.length > 6 && (
                  <label className="relative block">
                    <span className="sr-only">Buscar un equipo</span>
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>
                      search
                    </span>
                    <input
                      type="search"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Buscar un equipo"
                      className={`${inputCls} h-12 pl-11`}
                    />
                  </label>
                )}
                {equipos.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
                    No encontramos equipos
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {equipos.map(e => {
                      const dado = apoyos.get(e.torneo_equipo_id) ?? 0
                      return (
                        <li key={e.torneo_equipo_id}>
                          <button
                            type="button"
                            onClick={() => setSelected({ equipo: e, torneoId: torneo.torneo_id })}
                            className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60"
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                              {e.posicion}°
                            </span>
                            <TeamLogo src={e.equipo_logo_url} name={e.equipo_nombre} className="size-14" />
                            <div className="min-w-0 flex-1">
                              {e.categoria_nombre && (
                                <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  {e.categoria_nombre}
                                </p>
                              )}
                              <p className="truncate text-base font-bold text-slate-900 dark:text-white">{e.equipo_nombre}</p>
                              <p className="text-base text-slate-600 dark:text-slate-300">{fmt(e.total)} puntos</p>
                              {dado > 0 && (
                                <p className="text-base font-semibold text-rose-600 dark:text-rose-300">Ya le diste {fmt(dado)}</p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-slate-400" aria-hidden>
                              chevron_right
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )}
          </>
        ))
      )}

      {selected && (
        <ApoyarModal
          equipo={selected.equipo}
          saldo={saldo}
          onClose={() => setSelected(null)}
          onDone={() => load(true)}
        />
      )}
    </div>
  )
}
