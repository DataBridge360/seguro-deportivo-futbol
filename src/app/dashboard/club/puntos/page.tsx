'use client'

import { useEffect, useState } from 'react'
import RecompensasSection from '@/components/club/puntos/RecompensasSection'
import CategoriasSection from '@/components/club/puntos/CategoriasSection'
import PromocionesSection from '@/components/club/puntos/PromocionesSection'
import CanjesSection from '@/components/club/puntos/CanjesSection'
import EquivalenciaSection from '@/components/club/puntos/EquivalenciaSection'
import CompetenciasSection from '@/components/club/puntos/CompetenciasSection'
import { getPuntosCanjesClub } from '@/lib/api'

// Ordered by how often the club uses them; redemptions are the daily task.
const TABS = [
  { id: 'canjes', label: 'Canjes', icon: 'confirmation_number' },
  { id: 'recompensas', label: 'Recompensas', icon: 'redeem' },
  { id: 'promociones', label: 'Puntos dobles', icon: 'bolt' },
  { id: 'competencias', label: 'Competencias', icon: 'emoji_events' },
  { id: 'categorias', label: 'Categorías', icon: 'category' },
  { id: 'equivalencia', label: 'Equivalencia', icon: 'currency_exchange' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ClubPuntosPage() {
  const [tab, setTab] = useState<TabId>('canjes')
  const [pendientes, setPendientes] = useState<number | null>(null)

  useEffect(() => {
    getPuntosCanjesClub('pendiente', 1, 1)
      .then(res => setPendientes(res.total))
      .catch(() => setPendientes(null))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lo que los jugadores ganan comprando en la cantina y canjean por premios.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Secciones de puntos"
        className="-mx-4 flex snap-x overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden sm:px-0 dark:border-slate-700"
      >
        {TABS.map(t => {
          const selected = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls="puntos-panel"
              onClick={() => setTab(t.id)}
              className={`relative flex h-12 shrink-0 snap-start items-center gap-2 px-4 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full ${
                selected
                  ? 'text-primary after:bg-primary'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
              {t.id === 'canjes' && pendientes !== null && pendientes > 0 && (
                <span
                  className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold leading-5 text-white"
                  aria-label={`${pendientes} pendientes`}
                >
                  {pendientes}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div id="puntos-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'canjes' && <CanjesSection onPendientesChange={setPendientes} />}
        {tab === 'recompensas' && <RecompensasSection />}
        {tab === 'promociones' && <PromocionesSection />}
        {tab === 'competencias' && <CompetenciasSection />}
        {tab === 'categorias' && <CategoriasSection />}
        {tab === 'equivalencia' && (
          <div className="max-w-2xl">
            <EquivalenciaSection />
          </div>
        )}
      </div>
    </div>
  )
}
