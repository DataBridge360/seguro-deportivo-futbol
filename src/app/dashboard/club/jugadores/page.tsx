'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PageTabs, { type PageTab } from '@/components/ui/PageTabs'
import JugadoresSection from '@/components/club/JugadoresSection'
import VerificarQRSection from '@/components/club/VerificarQRSection'

const TABS = [
  { id: 'listado', label: 'Listado', icon: 'groups' },
  { id: 'verificar', label: 'Verificar QR', icon: 'qr_code_scanner' },
] as const satisfies readonly PageTab[]

type TabId = (typeof TABS)[number]['id']

function ClubJugadoresContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: TabId = searchParams.get('tab') === 'verificar' ? 'verificar' : 'listado'

  const handleChange = (id: TabId) => {
    router.replace(id === 'listado' ? pathname : `${pathname}?tab=${id}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jugadores</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Listado de jugadores del club y verificación de carnets
        </p>
      </div>

      <PageTabs tabs={TABS} value={tab} onChange={handleChange} label="Secciones de jugadores" panelId="jugadores-panel">
        {tab === 'listado' ? <JugadoresSection /> : <VerificarQRSection />}
      </PageTabs>
    </div>
  )
}

export default function ClubJugadoresPage() {
  return (
    <Suspense>
      <ClubJugadoresContent />
    </Suspense>
  )
}
