'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PageTabs, { type PageTab } from '@/components/ui/PageTabs'
import AnunciosSection from '@/components/club/AnunciosSection'
import NotificacionesPanel from '@/components/notificaciones/NotificacionesPanel'

const TABS = [
  { id: 'anuncios', label: 'Anuncios', icon: 'campaign' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'notifications' },
] as const satisfies readonly PageTab[]

type TabId = (typeof TABS)[number]['id']

function ClubComunicacionContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: TabId = searchParams.get('tab') === 'notificaciones' ? 'notificaciones' : 'anuncios'

  const handleChange = (id: TabId) => {
    router.replace(id === 'anuncios' ? pathname : `${pathname}?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comunicación</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Anuncios en el inicio de los jugadores y notificaciones push.
        </p>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={handleChange} label="Secciones de comunicación" panelId="comunicacion-panel">
        {tab === 'anuncios' ? <AnunciosSection /> : <NotificacionesPanel showHeader={false} />}
      </PageTabs>
    </div>
  )
}

export default function ClubComunicacionPage() {
  return (
    <Suspense>
      <ClubComunicacionContent />
    </Suspense>
  )
}
