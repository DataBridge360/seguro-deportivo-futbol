'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getPuntosCatalogo, type PuntosCatalogoRecompensa, type PuntosCatalogoResponse } from '@/lib/api'
import { matchesSearch } from '@/lib/utils'
import { fmt } from '@/components/club/puntos/ui'
import RecompensaModal from './RecompensaModal'
import RewardImage from './RewardImage'
import PuntosEquiposSection from './PuntosEquiposSection'

const ghostBtnCls =
  'flex min-h-11 items-center gap-1 rounded-full px-3 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'

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

  useEffect(() => {
    if (loading || window.location.hash !== '#equipos') return
    document.getElementById('equipos')?.scrollIntoView()
  }, [loading])
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos ClubPlaza</h1>
        <div className="flex">
          <Link href="/dashboard/jugador/puntos/historial" className={ghostBtnCls}>
            <span className="material-symbols-outlined" aria-hidden>
              receipt_long
            </span>
            Historial
          </Link>
          <Link href="/dashboard/jugador/puntos/canjes" className={ghostBtnCls}>
            <span className="material-symbols-outlined" aria-hidden>
              confirmation_number
            </span>
            Mis canjes
          </Link>
        </div>
      </div>

      <div>
        <p className="text-base text-slate-600 dark:text-slate-300">Tenés</p>
        {loading ? (
          <div className="mt-1 h-14 w-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" aria-hidden />
        ) : (
          <p className="flex items-center gap-2">
            <span className="text-5xl font-bold tabular-nums text-slate-900 dark:text-white">{fmt(saldo)}</span>
            <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">puntos</span>
            <span className="material-symbols-outlined text-3xl text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
              stars
            </span>
          </p>
        )}
        {data?.promocion_activa && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
              bolt
            </span>
            Hoy sumás x{data.promocion_activa.multiplicador}
          </p>
        )}
      </div>

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
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-base text-slate-600 dark:border-slate-600 dark:text-slate-300">
              Pronto vas a ver recompensas acá
            </p>
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

      <div className="border-t border-slate-200 pt-6 dark:border-slate-700" id="equipos">
        <PuntosEquiposSection variant="full" saldo={data ? saldo : undefined} onSaldoChange={n => setData(d => (d ? { ...d, saldo: n } : d))} />
      </div>

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
