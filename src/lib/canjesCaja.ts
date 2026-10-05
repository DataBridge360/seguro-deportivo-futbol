import { apiFetch, type CanjePorCodigo } from '@/lib/api'
import { normalizarDni } from '@/lib/cuponesCaja'

// Cashier flow: pending reward canjes are looked up by the player's DNI instead of a typed code.

export interface CanjesPorDniData {
  jugador: { id: string; nombre: string; apellido: string }
  canjes: CanjePorCodigo[]
}

export async function getCanjesPorDni(dni: string): Promise<CanjesPorDniData> {
  const res = await apiFetch(`/puntos/canjes/por-dni?dni=${encodeURIComponent(normalizarDni(dni))}`)
  return {
    jugador: res.jugador,
    // Same shape as getCanjePorCodigo so the detail/confirm flow is shared; pending canjes are never delivered
    canjes: (res.canjes ?? []).map(
      (c: CanjePorCodigo): CanjePorCodigo => ({
        id: c.id,
        codigo: c.codigo,
        estado: c.estado,
        costo_puntos: Number(c.costo_puntos) || 0,
        created_at: c.created_at,
        entregado_at: c.entregado_at ?? null,
        recompensa: c.recompensa ?? null,
        jugador: c.jugador ?? null,
      }),
    ),
  }
}
