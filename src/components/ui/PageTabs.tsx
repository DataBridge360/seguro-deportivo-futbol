'use client'

import type { ReactNode } from 'react'

export interface PageTab<T extends string = string> {
  id: T
  label: string
  /** Material Symbols icon name. */
  icon: string
  /** Counter shown next to the label; hidden when 0. */
  badge?: number
  badgeLabel?: string
}

interface PageTabsProps<T extends string> {
  tabs: readonly PageTab<T>[]
  value: T
  onChange: (id: T) => void
  /** Accessible name of the tablist. */
  label: string
  /** Id of the tabpanel; also namespaces the tab ids so several PageTabs can coexist. */
  panelId: string
  children: ReactNode
}

export default function PageTabs<T extends string>({ tabs, value, onChange, label, panelId, children }: PageTabsProps<T>) {
  return (
    <>
      <div
        role="tablist"
        aria-label={label}
        className="-mx-4 flex snap-x overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:mx-0 [&::-webkit-scrollbar]:hidden sm:px-0 dark:border-slate-700"
      >
        {tabs.map(t => {
          const selected = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${panelId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={panelId}
              onClick={() => onChange(t.id)}
              className={`relative flex h-12 shrink-0 snap-start items-center gap-2 px-4 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full ${
                selected
                  ? 'text-primary after:bg-primary'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden>
                {t.icon}
              </span>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span
                  className="min-w-5 rounded-full bg-primary px-1.5 text-center text-xs font-bold leading-5 text-white"
                  aria-label={t.badgeLabel ? `${t.badge} ${t.badgeLabel}` : undefined}
                >
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-tab-${value}`}>
        {children}
      </div>
    </>
  )
}
