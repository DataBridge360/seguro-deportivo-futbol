import { Suspense } from 'react'
import TablaEnVivo from '@/components/jugador/puntos/TablaEnVivo'

export default function TablaPuntosPage() {
  return (
    <Suspense fallback={null}>
      <TablaEnVivo />
    </Suspense>
  )
}
