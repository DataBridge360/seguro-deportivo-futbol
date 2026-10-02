import { flushSync } from 'react-dom'
import { useThemeStore } from '@/stores/themeStore'

type Theme = 'light' | 'dark'

// Switches the theme with the "circle-blur-top-left" View Transition from
// rudrodip/theme-toggle-effect (styles in globals.css). Browsers without the
// View Transitions API, or users who prefer reduced motion, get an instant switch.
export function switchTheme(next?: Theme) {
  const { theme, setTheme } = useThemeStore.getState()
  const target: Theme = next ?? (theme === 'dark' ? 'light' : 'dark')
  if (target === theme) return

  const apply = () => flushSync(() => setTheme(target))

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    apply()
    return
  }

  document.startViewTransition(apply)
}
