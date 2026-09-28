import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date-only string (e.g. `fecha_nacimiento`, 'YYYY-MM-DD') as 'DD/MM/YYYY'.
 *
 * Date-only strings are parsed by the JS spec as UTC midnight. In timezones behind
 * UTC (like Argentina, UTC-3), `new Date('YYYY-MM-DD').toLocaleDateString(...)` rolls
 * the date back to the previous day. To avoid that, we extract the year/month/day
 * directly from the string via regex when it is date-only (or a UTC-midnight
 * timestamp), never constructing a `Date` object, so no timezone conversion happens.
 */
export function formatDateOnly(dateStr: string | null | undefined, fallback = '-'): string {
  if (!dateStr) return fallback

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?(Z|\+00:00)?)?$/)
  if (match) {
    const [, year, month, day] = match
    return `${day}/${month}/${year}`
  }

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Normalizes text for searching: strips accents (diacritics), lowercases,
 * trims and collapses repeated whitespace.
 */
export function normalizeSearch(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Use for every client-side search so accents and case never matter.
 *
 * Returns true when the normalized query is empty, or when every word of the
 * query is contained in the normalized (joined) haystack.
 */
export function matchesSearch(
  haystack: string | null | undefined | Array<string | null | undefined>,
  query: string
): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const text = normalizeSearch(Array.isArray(haystack) ? haystack.join(' ') : haystack)
  return q.split(' ').every(word => text.includes(word))
}
