'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PageTabs, { type PageTab } from '@/components/ui/PageTabs'
import TorneosListPage from '@/components/torneos/TorneosListPage'
import EquiposListPage from '@/components/equipos/EquiposListPage'

const TABS = [
  { id: 'torneos', label: 'Torneos', icon: 'emoji_events' },
  { id: 'equipos', label: 'Equipos', icon: 'shield' },
] as const satisfies readonly PageTab[]

type TabId = (typeof TABS)[number]['id']

function ClubTorneosContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: TabId = searchParams.get('tab') === 'equipos' ? 'equipos' : 'torneos'

  const handleChange = (id: TabId) => {
    router.replace(id === 'torneos' ? pathname : `${pathname}?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Torneos y equipos</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Armá tus torneos y administrá los equipos del club.
        </p>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={handleChange} label="Secciones de torneos y equipos" panelId="torneos-panel">
        <div className="pt-5">
          {tab === 'torneos' ? (
            <TorneosListPage basePath="/dashboard/club/torneos" hideHeader />
          ) : (
            <EquiposListPage basePath="/dashboard/club/equipos" hideHeader />
          )}
        </div>
      </PageTabs>
    </div>
  )
}

export default function ClubTorneosPage() {
  return (
    <Suspense>
      <ClubTorneosContent />
    </Suspense>
  )
}
