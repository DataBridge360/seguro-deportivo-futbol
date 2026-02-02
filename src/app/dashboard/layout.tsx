'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { getNavigationForRole } from '@/lib/navigation'
import Link from 'next/link'
import {
  Home, Users, BarChart3, Settings, Building2, FileText, User, LogOut, Menu, X
} from 'lucide-react'

// Icon map for sidebar navigation
const iconMap: Record<string, any> = {
  Home, Users, BarChart3, Settings, Building2, FileText, User
}

// Mobile nav items for jugador
const jugadorNavItems = [
  { href: '/dashboard', icon: 'home', label: 'Inicio' },
  { href: '/dashboard/jugador/beneficios', icon: 'sell', label: 'Beneficios' },
  { href: '/dashboard/jugador/partidos', icon: 'sports_soccer', label: 'Partidos' },
  { href: '/dashboard/jugador/perfil', icon: 'person', label: 'Perfil' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  if (!user) return null

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    router.replace('/login')
  }

  // Si es jugador, usar layout responsive (mobile + desktop)
  if (user.role === 'jugador') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        {/* Desktop Header - hidden on mobile */}
        <header className="hidden md:block sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <span className="font-bold text-xl tracking-tight uppercase text-slate-900 dark:text-white">Seguro Deportivo</span>

              <div className="flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <span className="material-symbols-outlined text-sm">search</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar beneficios, trámites..."
                    className="block w-full pl-10 pr-3 py-2 border-none rounded-full bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-primary text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
                </button>
                <Link
                  href="/dashboard/jugador/perfil"
                  className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white ring-2 ring-primary/20">
                    <span className="material-symbols-outlined">account_circle</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header - hidden on desktop */}
        <div className="md:hidden sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-3 sm:p-4 pb-2 justify-between max-w-[480px] mx-auto">
          <div className="flex size-10 sm:size-12 shrink-0 items-center">
            <div className="bg-primary/20 rounded-full size-8 sm:size-10 border-2 border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg sm:text-2xl">person</span>
            </div>
          </div>
          <h2 className="text-[#111518] dark:text-white text-sm sm:text-lg font-bold leading-tight flex-1 text-center uppercase tracking-[0.1em]">
            Seguro Deportivo
          </h2>
          <div className="flex w-10 sm:w-12 items-center justify-end">
            <button className="flex size-8 sm:size-10 cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm text-[#111518] dark:text-white">
              <span className="material-symbols-outlined text-lg sm:text-2xl">notifications</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="md:max-w-7xl md:mx-auto md:px-4 md:py-8 px-3 py-4 pb-24 md:pb-8 max-w-[480px] mx-auto md:max-w-none">
          {children}
        </main>

        {/* Bottom Navigation - mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex gap-1 sm:gap-2 border-t border-[#f0f3f4] dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-4 pb-6 sm:pb-8 pt-2 sm:pt-3 max-w-[480px] mx-auto">
          {jugadorNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 sm:gap-1.5 ${
                  isActive ? 'text-primary' : 'text-[#617989] dark:text-slate-400'
                }`}
              >
                <div className="flex h-6 sm:h-8 items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[22px] sm:text-[28px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <p className={`text-[9px] sm:text-[10px] leading-normal tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </p>
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle - bottom right */}
        <div className="fixed bottom-6 right-6 z-50 hidden md:block">
          <button
            onClick={toggleTheme}
            className="w-12 h-12 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
          >
            <span className={`material-symbols-outlined ${theme === 'dark' ? 'hidden' : ''}`}>dark_mode</span>
            <span className={`material-symbols-outlined ${theme === 'dark' ? '' : 'hidden'}`}>light_mode</span>
          </button>
        </div>
      </div>
    )
  }

  // Para admin, productor y club: layout con sidebar
  const navigation = getNavigationForRole(user.role)

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-56 sm:w-64 bg-slate-800 border-r border-slate-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-bold text-white">Seguro Deportivo</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-slate-700 rounded text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-3 sm:p-4 border-b border-slate-700">
            <p className="font-medium truncate text-white text-sm sm:text-base">{user.name}</p>
            <p className="text-xs sm:text-sm text-slate-400 capitalize">{user.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = iconMap[item.icon] || Home
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 sm:p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-slate-800 border-b border-slate-700 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 hover:bg-slate-700 rounded text-white"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="font-semibold text-white text-sm sm:text-base">Seguro Deportivo</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
