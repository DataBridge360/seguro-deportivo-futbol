import { apiFetch, type CompraCajaItem } from '@/lib/api'

// Club accounting of a single player (full-access club profiles only).

export interface ResumenJugadorClub {
  jugador: { id: string; nombre: string; apellido: string; dni: string | null }
  saldo: number
  total_compras: number
  total_gastado: number
  total_descuentos: number
  puntos_ganados: number
  puntos_canjeados: number
  canjes_pendientes: number
}

export type TipoMovimiento = 'compra' | 'canje' | 'apoyo' | 'anulacion' | 'ajuste'

export interface MovimientoJugador {
  id: string
  tipo: TipoMovimiento
  puntos: number
  monto_compra: number | null
  descripcion: string | null
  created_at: string
  referencia_id: string | null
  multiplicador: number | null
}

export type EstadoCanje = 'pendiente' | 'entregado' | 'anulado'

export interface CanjeJugador {
  id: string
  codigo: string
  estado: EstadoCanje
  costo_puntos: number
  created_at: string
  entregado_at: string | null
  anulado_at: string | null
  recompensa: { titulo: string; imagen_url: string | null } | null
}

export interface PaginaPuntos<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// api.ts' CompraCajaItem predates the cashier ("creado_por") field
export type CompraConCobrador = CompraCajaItem & {
  creado_por?: { id: string; nombre: string | null } | null
}

export interface ComprasJugadorPage {
  items: CompraConCobrador[]
  total_count: number
}

export const MOVIMIENTO_LABEL: Record<TipoMovimiento, string> = {
  compra: 'Compra',
  canje: 'Canje',
  apoyo: 'Apoyo',
  anulacion: 'Anulación',
  ajuste: 'Ajuste',
}

export const CANJE_ESTADO_LABEL: Record<EstadoCanje, string> = {
  pendiente: 'Pendiente',
  entregado: 'Entregado',
  anulado: 'Anulado',
}

export async function getResumenJugadorClub(jugadorId: string): Promise<ResumenJugadorClub> {
  return apiFetch(`/puntos/club/jugadores/${encodeURIComponent(jugadorId)}/resumen`)
}

export async function getMovimientosJugadorClub(
  jugadorId: string,
  page: number,
  limit: number,
): Promise<PaginaPuntos<MovimientoJugador>> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiFetch(`/puntos/club/jugadores/${encodeURIComponent(jugadorId)}/movimientos?${qs.toString()}`)
}

export async function getCanjesJugadorClub(
  jugadorId: string,
  page: number,
  limit: number,
): Promise<PaginaPuntos<CanjeJugador>> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  return apiFetch(`/puntos/club/jugadores/${encodeURIComponent(jugadorId)}/canjes?${qs.toString()}`)
}

// The compras list pages by offset; without dates it returns the player's whole history
export async function getComprasJugadorClub(
  jugadorId: string,
  offset: number,
  limit: number,
): Promise<ComprasJugadorPage> {
  const qs = new URLSearchParams({ jugador_id: jugadorId, limit: String(limit), offset: String(offset) })
  const res = await apiFetch(`/compras?${qs.toString()}`)
  return { items: res.data.items, total_count: res.data.total_count }
}
