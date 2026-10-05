'use client'

import { useEffect, useState } from 'react'
import RecompensasSection from '@/components/club/puntos/RecompensasSection'
import CategoriasSection from '@/components/club/puntos/CategoriasSection'
import PromocionesSection from '@/components/club/puntos/PromocionesSection'
import CanjesSection from '@/components/club/puntos/CanjesSection'
import EquivalenciaSection from '@/components/club/puntos/EquivalenciaSection'
import CompetenciasSection from '@/components/club/puntos/CompetenciasSection'
import PageTabs from '@/components/ui/PageTabs'
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

  const tabs = TABS.map(t =>
    t.id === 'canjes' && pendientes !== null ? { ...t, badge: pendientes, badgeLabel: 'pendientes' } : t
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Lo que los jugadores ganan comprando en la cantina y canjean por premios.
        </p>
      </div>

      <PageTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        label="Secciones de puntos"
        panelId="puntos-panel"
      >
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
      </PageTabs>
    </div>
  )
}
