'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

const THEME_COLORS = {
  light: '#f6f7f8',
  dark: '#0a0a0a',
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)

    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark)
    }
  }, [theme])

  return <>{children}</>
}
