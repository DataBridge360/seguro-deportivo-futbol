'use client'

import { useState } from 'react'
import RecompensasSection from '@/components/club/puntos/RecompensasSection'
import CategoriasSection from '@/components/club/puntos/CategoriasSection'
import PromocionesSection from '@/components/club/puntos/PromocionesSection'
import CanjesSection from '@/components/club/puntos/CanjesSection'
import EquivalenciaSection from '@/components/club/puntos/EquivalenciaSection'
import CompetenciasSection from '@/components/club/puntos/CompetenciasSection'

const TABS = [
  { id: 'recompensas', label: 'Recompensas' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'promociones', label: 'Puntos dobles' },
  { id: 'canjes', label: 'Canjes' },
  { id: 'competencias', label: 'Competencias' },
  { id: 'equivalencia', label: 'Equivalencia' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ClubPuntosPage() {
  const [tab, setTab] = useState<TabId>('recompensas')

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos ClubPlaza</h1>

      <div role="tablist" aria-label="Secciones de puntos" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-12 shrink-0 rounded-xl px-5 text-base font-semibold transition-colors ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'recompensas' && <RecompensasSection />}
      {tab === 'categorias' && <CategoriasSection />}
      {tab === 'promociones' && <PromocionesSection />}
      {tab === 'canjes' && <CanjesSection />}
      {tab === 'competencias' && <CompetenciasSection />}
      {tab === 'equivalencia' && <EquivalenciaSection />}
    </div>
  )
}
