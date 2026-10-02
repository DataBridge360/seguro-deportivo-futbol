'use client'

import { useEffect, useState } from 'react'
import { MorphIcon, type IconNode } from 'morphicons/react'
import { Moon, Sun } from 'lucide'
import { useThemeStore } from '@/stores/themeStore'
import { switchTheme } from '@/lib/themeTransition'

// lucide@0.312 exports ['svg', attrs, children]; morphicons wants the children.
const SUN = Sun[2] as unknown as IconNode
const MOON = Moon[2] as unknown as IconNode

const VARIANTS = {
  // Matches the notification button in the jugador header; also used in the
  // top-right corner of the landing and login cards.
  header:
    'size-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
  // Plain icon button for the staff sidebar and header.
  plain:
    'size-9 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/[0.06]',
} as const

interface ThemeToggleProps {
  variant?: keyof typeof VARIANTS
  className?: string
}

export default function ThemeToggle({ variant = 'header', className = '' }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme)
  // The stored theme is only known on the client; render the icon after mount
  // so the server markup never disagrees with it (and nothing morphs on load).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'
  const iconSize = variant === 'plain' ? 20 : 22

  return (
    <button
      type="button"
      onClick={() => switchTheme()}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={`flex shrink-0 items-center justify-center transition-colors active:scale-95 ${VARIANTS[variant]} ${className}`}
    >
      {mounted ? (
        <MorphIcon
          icon={isDark ? MOON : SUN}
          spring="snappy"
          strokeWidth={1.5}
          size={iconSize}
          reducedMotion="user"
        />
      ) : (
        <span style={{ width: iconSize, height: iconSize }} aria-hidden="true" />
      )}
    </button>
  )
}
