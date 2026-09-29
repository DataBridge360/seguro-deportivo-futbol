import EquiposClasificacion from '@/components/jugador/puntos/EquiposClasificacion'
import BackToPuntos from '@/components/jugador/puntos/BackToPuntos'

export default function EquiposPuntosPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      <BackToPuntos />
      <EquiposClasificacion />
    </div>
  )
}
