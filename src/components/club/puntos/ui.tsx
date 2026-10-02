'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export const fmt = (n: number) => n.toLocaleString('es-AR')

export const inputCls =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white'

export const labelCls = 'mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300'

export const primaryBtnCls =
  'flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

export const secondaryBtnCls =
  'flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

export const dangerBtnCls =
  'flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-base font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'

// Club admin screens: lighter buttons for dense lists (the jugador app keeps the large ones)
export const compactPrimaryBtnCls =
  'flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

export const compactSecondaryBtnCls =
  'flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

export const cardCls = 'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800'

// Square icon actions for list rows (44px touch target)
export const iconBtnCls =
  'flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'

export const iconDangerBtnCls =
  'flex size-11 shrink-0 items-center justify-center rounded-xl text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-500/10'

/** Section intro: what the tab is for, and its main action on the right. */
export function SectionHeader({ description, action }: { description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="shrink-0 [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
    </div>
  )
}

/** Empty list: says what is missing and, when there is one, the next step. */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-600">
      <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500" aria-hidden>
        {icon}
      </span>
      <p className="mt-2 text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export function ListSkeleton({ rows = 3, className = 'h-20' }: { rows?: number; className?: string }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 ${className}`} />
      ))}
    </div>
  )
}

export function Spinner() {
  return <span className="material-symbols-outlined animate-spin">progress_activity</span>
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </p>
  )
}

export function Pill({ active, on = 'Activa', off = 'Inactiva' }: { active: boolean; on?: string; off?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
      }`}
    >
      {active ? on : off}
    </span>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-base font-medium text-slate-900 dark:text-white">{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-disabled:opacity-60 dark:bg-slate-600"
      />
    </label>
  )
}

let openModals = 0

export function Modal({
  title,
  onClose,
  busy = false,
  suspended = false,
  children,
  footer,
  wide = false,
}: {
  title: string
  onClose: () => void
  busy?: boolean
  // When another modal is stacked on top, ignore Escape and backdrop clicks
  suspended?: boolean
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const stateRef = useRef({ busy, suspended })
  stateRef.current = { busy, suspended }

  useEffect(() => {
    openModals += 1
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !stateRef.current.busy && !stateRef.current.suspended) closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      openModals -= 1
      if (openModals === 0) document.body.style.overflow = prev
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget && !busy && !suspended) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800 ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-700">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel: string
  busy: boolean
  error: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={secondaryBtnCls}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={dangerBtnCls}>
            {busy && <Spinner />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-base text-slate-700 dark:text-slate-200">{message}</p>
      <ErrorNote message={error} />
    </Modal>
  )
}

export function formatDate(d: string | null): string {
  if (!d) return ''
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

export function errMsg(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback
}
