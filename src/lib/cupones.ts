import type { CuponResponse } from '@/lib/api'

export type CuponEstado = 'disponible' | 'usado' | 'vencido'

type CuponVigencia = Pick<CuponResponse, 'usado' | 'fecha_vencimiento' | 'valido_desde' | 'valido_hasta'>

function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Expired by date, or past the end of its validity window. */
export function isCuponVencido(cupon: CuponVigencia): boolean {
  if (cupon.valido_hasta && new Date(cupon.valido_hasta).getTime() <= Date.now()) return true
  return !!cupon.fecha_vencimiento && cupon.fecha_vencimiento.slice(0, 10) < todayDate()
}

export function getCuponEstado(cupon: CuponVigencia): CuponEstado {
  if (cupon.usado) return 'usado'
  if (isCuponVencido(cupon)) return 'vencido'
  return 'disponible'
}

/** The coupon is listed but its window has not started yet. */
export function isCuponPendiente(cupon: Pick<CuponResponse, 'valido_desde'>): boolean {
  return !!cupon.valido_desde && new Date(cupon.valido_desde).getTime() > Date.now()
}

function formatInstant(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** Short validity text for a coupon card. */
export function formatCuponVigencia(cupon: Pick<CuponResponse, 'fecha_vencimiento' | 'valido_desde' | 'valido_hasta'>): string {
  if (cupon.valido_hasta) {
    if (cupon.valido_desde && isCuponPendiente(cupon)) return `Desde el ${formatInstant(cupon.valido_desde)}`
    return `Hasta el ${formatInstant(cupon.valido_hasta)}`
  }
  if (cupon.fecha_vencimiento) {
    const [y, m, d] = cupon.fecha_vencimiento.slice(0, 10).split('-')
    return `Vence el ${d}/${m}/${y}`
  }
  return 'Sin vencimiento'
}

export function formatCuponInicio(validoDesde: string): string {
  return formatInstant(validoDesde)
}
