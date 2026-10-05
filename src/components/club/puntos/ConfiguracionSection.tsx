'use client'

import { useState, type ReactNode } from 'react'
import PromocionesSection from '@/components/club/puntos/PromocionesSection'
import CompetenciasSection from '@/components/club/puntos/CompetenciasSection'
import CategoriasSection from '@/components/club/puntos/CategoriasSection'
import EquivalenciaSection from '@/components/club/puntos/EquivalenciaSection'

const ITEMS: { id: string; title: string; hint: string; icon: string; render: () => ReactNode }[] = [
  {
    id: 'promociones',
    title: 'Promociones',
    hint: 'Días y horarios en los que se ganan puntos dobles.',
    icon: 'bolt',
    render: () => <PromocionesSection />,
  },
  {
    id: 'competencias',
    title: 'Competencias',
    hint: 'Premios por puntos para los jugadores de cada torneo.',
    icon: 'emoji_events',
    render: () => <CompetenciasSection />,
  },
  {
    id: 'categorias',
    title: 'Categorías de recompensas',
    hint: 'Grupos para ordenar las recompensas.',
    icon: 'category',
    render: () => <CategoriasSection />,
  },
  {
    id: 'equivalencia',
    title: 'Equivalencia',
    hint: 'Cuántos puntos se ganan por cada peso gastado.',
    icon: 'currency_exchange',
    render: () => (
      <div className="max-w-2xl">
        <EquivalenciaSection />
      </div>
    ),
  },
]

/** Rarely-touched points settings, stacked as cards where only one is open at a time. */
export default function ConfiguracionSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {ITEMS.map(item => {
        const open = openId === item.id
        return (
          <section
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          >
            <h2>
              <button
                type="button"
                id={`puntos-config-${item.id}-header`}
                aria-expanded={open}
                aria-controls={`puntos-config-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
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
                <span
                  className={`material-symbols-outlined shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  expand_more
                </span>
              </button>
            </h2>
            {open && (
              <div
                id={`puntos-config-${item.id}`}
                role="region"
                aria-labelledby={`puntos-config-${item.id}-header`}
                className="border-t border-slate-200 p-4 dark:border-slate-700"
              >
                {item.render()}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
