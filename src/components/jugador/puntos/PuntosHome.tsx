'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getPuntosCatalogo, type PuntosCatalogoRecompensa, type PuntosCatalogoResponse } from '@/lib/api'
import { matchesSearch } from '@/lib/utils'
import { fmt } from '@/components/club/puntos/ui'
import RecompensaModal from './RecompensaModal'
import RewardImage from './RewardImage'
import ApoyarAviso from './ApoyarAviso'

const chipCls =
  'inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-transform active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map(i => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  )
}

export default function PuntosHome() {
  const [data, setData] = useState<PuntosCatalogoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [selected, setSelected] = useState<PuntosCatalogoRecompensa | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      setData(await getPuntosCatalogo())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar las recompensas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saldo = data?.saldo ?? 0

  const available = (data?.recompensas ?? []).filter(r => !r.agotado)
  const nextReward =
    available.filter(r => r.costo_puntos > saldo).sort((x, y) => x.costo_puntos - y.costo_puntos)[0] ?? null
  const progress = nextReward ? Math.min(100, Math.max(0, Math.round((saldo / nextReward.costo_puntos) * 100))) : 100

  const categorias = data?.categorias ?? []
  const categoriaActual = categorias.find(c => c.id === categoria) ?? null

  const filtered = useMemo(
    () =>
      (data?.recompensas ?? []).filter(
        r =>
          (!categoria || r.categoria_id === categoria) &&
          matchesSearch([r.titulo, r.descripcion, r.categoria_nombre], query)
      ),
    [data, categoria, query]
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
          <span className="block">Puntos</span>
          <span className="block text-primary dark:text-sky-300">ClubPlaza</span>
        </h1>
        <div className="flex gap-2">
          <Link href="/dashboard/jugador/puntos/historial" className={chipCls}>
            <span className="material-symbols-outlined text-lg" aria-hidden>
              receipt_long
            </span>
            Historial
          </Link>
          <Link href="/dashboard/jugador/puntos/canjes" className={chipCls}>
            <span className="material-symbols-outlined text-lg" aria-hidden>
              confirmation_number
            </span>
            Mis canjes
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_-4px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-800">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-amber-200/40 via-blue-100/30 to-transparent blur-2xl dark:from-amber-400/15 dark:via-blue-400/10"
          aria-hidden
        />
        <div className="relative space-y-3">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tenés</p>
          {loading ? (
            <div className="h-12 w-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" aria-hidden />
          ) : (
            <p className="flex items-center gap-2">
              <span className="text-5xl font-black leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
                {fmt(saldo)}
              </span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-200">puntos</span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_14px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/30 dark:border-slate-800"
                aria-hidden
              >
                <span className="material-symbols-outlined text-base text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              </span>
            </p>
          )}
          {data?.promocion_activa && (
            <p className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-gradient-to-r from-amber-100 to-amber-50 px-3 py-1 text-xs font-bold text-amber-900 dark:border-amber-500/30 dark:from-amber-500/20 dark:to-amber-500/10 dark:text-amber-200">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
                bolt
              </span>
              Hoy sumás x{data.promocion_activa.multiplicador}
            </p>
          )}
          {!loading && data && available.length > 0 && nextReward && (
            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
              <div className="flex items-baseline justify-between gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="min-w-0 truncate">
                  {nextReward.titulo.length <= 24 ? `Próxima: ${nextReward.titulo}` : 'Próxima recompensa'}
                </span>
                <span className="shrink-0 tabular-nums">
                  {fmt(saldo)} / {fmt(nextReward.costo_puntos)} pts
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-slate-100 dark:bg-slate-700"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label="Progreso hacia la próxima recompensa"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ApoyarAviso />

      <label className="relative block">
        <span className="sr-only">Buscar una recompensa</span>
        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden>
          search
        </span>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar una recompensa"
          className="h-12 w-full rounded-full border border-slate-300 bg-white pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
        />
      </label>

      {categorias.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Categorías">
          {[{ id: null as string | null, nombre: 'Todos' }, ...categorias].map(c => {
            const active = categoria === c.id
            return (
              <button
                key={c.id ?? 'todos'}
                type="button"
                aria-pressed={active}
                onClick={() => setCategoria(c.id)}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-base font-semibold transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary dark:border-sky-300 dark:bg-primary/20 dark:text-sky-200'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {c.nombre}
              </button>
            )
          })}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {categoriaActual ? categoriaActual.nombre : 'Recompensas'}
        </h2>

          {error && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => load()}
                className="h-11 rounded-xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <Skeleton />
          ) : data && data.recompensas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-8 text-center dark:border-slate-600">
              <span
                className="material-symbols-outlined text-5xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden
              >
                redeem
              </span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Próximamente</p>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Muy pronto vas a poder canjear tus puntos por recompensas. Mientras tanto, seguí sumando: cada compra en
                la cantina te da puntos.
              </p>
            </div>
          ) : data && filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
              No encontramos recompensas con esa búsqueda
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map(r => {
                const faltan = r.costo_puntos - saldo
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      className={`flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/60 ${
                        r.agotado ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      <RewardImage src={r.imagen_url} alt={r.titulo} className="size-24 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-1">
                        {r.categoria_nombre && (
                          <p className="truncate text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {r.categoria_nombre}
                          </p>
                        )}
                        <p className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{r.titulo}</p>
                        <p className="text-base font-bold text-primary dark:text-sky-300">{fmt(r.costo_puntos)} puntos</p>
                        {r.agotado ? (
                          <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-600 dark:text-slate-100">
                            Agotada
                          </span>
                        ) : (
                          faltan > 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Te faltan {fmt(faltan)} puntos</p>
                          )
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
      </section>

      {selected && (
        <RecompensaModal
          recompensa={selected}
          saldo={saldo}
          onClose={() => setSelected(null)}
          onRedeemed={() => load(true)}
        />
      )}
    </div>
  )
}
