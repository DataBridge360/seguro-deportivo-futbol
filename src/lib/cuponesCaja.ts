import { apiFetch, type RegistrarCompraBody, type RegistrarCompraData } from '@/lib/api'

// Cashier flow: coupons are looked up by the player's DNI instead of a typed code.

export interface CuponDisponible {
  // Coupon id for personal coupons, template id for 'plantilla' ones (the backend accepts either)
  id: string
  kind: 'cupon' | 'plantilla'
  titulo: string
  tipo_descuento: 'porcentaje' | 'monto_fijo'
  valor_descuento: number
  monto_minimo_compra: number | null
  fecha_vencimiento: string | null
  valido_hasta: string | null
  color: string | null
}

export interface CuponesDisponiblesData {
  jugador: { id: string; nombre: string; apellido: string }
  cupones: CuponDisponible[]
}

/** DNI as the backend compares it: digits only (drops dots and spaces). */
export function normalizarDni(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export async function getCuponesDisponibles(dni: string): Promise<CuponesDisponiblesData> {
  const res = await apiFetch(`/cupones/disponibles?dni=${encodeURIComponent(normalizarDni(dni))}`)
  return res.data
}

// api.ts' RegistrarCompraBody has no cupon_id yet; it is mutually exclusive with cupon_codigo
export type RegistrarCompraConCuponIdBody = Omit<RegistrarCompraBody, 'cupon_codigo'> & {
  cupon_id?: string
}

// Club only: the cantina that charges; api.ts' RegistrarCompraBody has no cantina_id yet
export type RegistrarCompraBodyConCantina = RegistrarCompraBody & { cantina_id?: string }

export async function registrarCompraConCuponId(body: RegistrarCompraConCuponIdBody & { cantina_id?: string }): Promise<RegistrarCompraData> {
  const res = await apiFetch('/compras', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}

export async function registrarCompraConCantina(body: RegistrarCompraBodyConCantina): Promise<RegistrarCompraData> {
  const res = await apiFetch('/compras', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.data
}
