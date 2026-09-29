'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getPuntosCatalogo, type PuntosCatalogoRecompensa, type PuntosCatalogoResponse } from '@/lib/api'
import { matchesSearch } from '@/lib/utils'
import { fmt } from '@/components/club/puntos/ui'
import RecompensaModal from './RecompensaModal'
import RewardImage from './RewardImage'

const iconBtnCls =
  'flex size-12 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

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
    <div className="mx-auto max-w-2xl">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b3a63] to-[#1392ec] px-4 pb-10 pt-5 text-white shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Puntos ClubPlaza</h1>
          <div className="flex gap-2">
            <Link href="/dashboard/jugador/puntos/canjes" aria-label="Mis canjes" className={iconBtnCls}>
              <span className="material-symbols-outlined">confirmation_number</span>
            </Link>
            <Link href="/dashboard/jugador/puntos/historial" aria-label="Historial" className={iconBtnCls}>
              <span className="material-symbols-outlined">receipt_long</span>
            </Link>
          </div>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Buscar una recompensa</span>
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar una recompensa"
            className="h-12 w-full rounded-full bg-white pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/60"
          />
        </label>

        {categorias.length > 0 && (
          <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-1" role="group" aria-label="Categorías">
            {[{ id: null as string | null, nombre: 'Todos', icono: 'apps' as string | null }, ...categorias].map(c => {
              const active = categoria === c.id
              return (
                <button
                  key={c.id ?? 'todos'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoria(c.id)}
                  className="flex w-20 shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex size-16 items-center justify-center rounded-2xl transition-colors ${
                      active ? 'bg-white text-primary' : 'bg-white/15 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl">{c.icono || 'redeem'}</span>
                  </span>
                  <span className={`line-clamp-2 text-center text-sm leading-tight ${active ? 'font-bold' : 'font-medium'}`}>
                    {c.nombre}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Balance card */}
      <div className="relative -mt-6 mx-3 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Mis Puntos</p>
            <p className="text-base text-slate-600 dark:text-slate-300">ClubPlaza</p>
          </div>
          {loading ? (
            <div className="h-11 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
          ) : (
            <span className="rounded-full bg-sky-100 px-5 py-2 text-2xl font-extrabold text-primary dark:bg-primary/25 dark:text-sky-200">
              {fmt(saldo)}
            </span>
          )}
        </div>
        {data?.promocion_activa && (
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 p-3 text-white shadow">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            <div>
              <p className="text-base font-extrabold">¡Hoy sumás puntos x{data.promocion_activa.multiplicador}!</p>
              <p className="text-sm text-white/90">{data.promocion_activa.titulo}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-5">
        <Link
          href="/dashboard/jugador/puntos/apoyar"
          className="flex min-h-16 items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 transition-colors hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:hover:bg-rose-500/20"
        >
          <span
            className="material-symbols-outlined text-3xl text-rose-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            favorite
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-slate-900 dark:text-white">¡Apoyá a tu equipo!</p>
            <p className="text-base text-slate-600 dark:text-slate-300">Usá tus puntos para empujar a tu equipo en la tabla</p>
          </div>
          <span className="material-symbols-outlined text-slate-400" aria-hidden>
            chevron_right
          </span>
        </Link>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {categoriaActual ? categoriaActual.nombre : 'Todas las recompensas'}
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
