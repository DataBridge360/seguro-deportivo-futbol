'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PromocionesSection from '@/components/club/puntos/PromocionesSection'
import CompetenciasSection from '@/components/club/puntos/CompetenciasSection'
import CategoriasSection from '@/components/club/puntos/CategoriasSection'
import EquivalenciaSection from '@/components/club/puntos/EquivalenciaSection'

const ITEMS = [
  {
    id: 'promociones',
    title: 'Puntos dobles',
    hint: 'Días y fechas en los que las compras suman más puntos.',
    icon: 'bolt',
    render: (): ReactNode => <PromocionesSection />,
  },
  {
    id: 'competencias',
    title: 'Competencias',
    hint: 'Fechas en las que los jugadores apoyan equipos de cada torneo.',
    icon: 'emoji_events',
    render: (): ReactNode => <CompetenciasSection />,
  },
  {
    id: 'categorias',
    title: 'Categorías de recompensas',
    hint: 'Grupos para ordenar las recompensas.',
    icon: 'category',
    render: (): ReactNode => <CategoriasSection />,
  },
  {
    id: 'equivalencia',
    title: 'Equivalencia',
    hint: 'Cuántos puntos se ganan por cada peso gastado.',
    icon: 'currency_exchange',
    render: (): ReactNode => (
      <div className="max-w-2xl">
        <EquivalenciaSection />
      </div>
    ),
  },
]

/**
 * Rarely-touched points settings: a menu of cards, each opening its own screen.
 * The open screen lives in the `seccion` query param so back and reload keep it.
 */
export default function ConfiguracionSection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const titleRef = useRef<HTMLHeadingElement>(null)

  const current = ITEMS.find(i => i.id === searchParams.get('seccion')) ?? null
  const currentId = current?.id ?? null

  // Moves keyboard/screen-reader focus to the new screen's title once it opens
  useEffect(() => {
    if (currentId) titleRef.current?.focus()
  }, [currentId])

  const go = (seccion: string | null, mode: 'push' | 'replace') => {
    const params = new URLSearchParams(searchParams.toString())
    if (seccion) params.set('seccion', seccion)
    else params.delete('seccion')
    router[mode](`${pathname}?${params.toString()}`, { scroll: false })
  }

  if (current) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => go(null, 'push')}
            className="-ml-2 flex h-11 items-center gap-1 rounded-xl pl-1 pr-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden>
              arrow_back
            </span>
            Configuración
          </button>
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="text-xl font-bold text-slate-900 outline-none dark:text-white"
          >
            {current.title}
          </h2>
        </div>
        {current.render()}
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {ITEMS.map(item => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => go(item.id, 'push')}
            className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-2xl" aria-hidden>
                {item.icon}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold text-slate-900 dark:text-white">{item.title}</span>
              <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{item.hint}</span>
            </span>
            <span className="material-symbols-outlined shrink-0 text-slate-400 dark:text-slate-500" aria-hidden>
              chevron_right
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
