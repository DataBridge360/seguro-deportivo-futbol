'use client'

import { useEffect, useState } from 'react'
import RecompensasSection from '@/components/club/puntos/RecompensasSection'
import CanjesSection from '@/components/club/puntos/CanjesSection'
import ConfiguracionSection from '@/components/club/puntos/ConfiguracionSection'
import PageTabs from '@/components/ui/PageTabs'
import { getPuntosCanjesClub } from '@/lib/api'

// Redemptions are the daily task; everything else lives under settings.
const TABS = [
  { id: 'canjes', label: 'Canjes', icon: 'confirmation_number' },
  { id: 'recompensas', label: 'Recompensas', icon: 'redeem' },
  { id: 'configuracion', label: 'Configuración', icon: 'settings' },
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
          Canjes de tus jugadores y premios para ofrecerles.
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
        {tab === 'configuracion' && <ConfiguracionSection />}
      </PageTabs>
    </div>
  )
}
