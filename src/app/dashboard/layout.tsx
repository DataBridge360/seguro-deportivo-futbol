'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { getNavigationForRole } from '@/lib/navigation'
import Link from 'next/link'
import {
  Home, Users, BarChart3, Settings, Building2, FileText, User, LogOut, Menu, X,
  Shield, Trophy, Calendar, Bell, ScanLine, Calculator, Ticket, LayoutGrid
} from 'lucide-react'

// Icon map for sidebar navigation
const iconMap: Record<string, any> = {
  Home, Users, BarChart3, Settings, Building2, FileText, User, Shield, Trophy, Calendar, Bell,
  ScanLine, Calculator, Ticket, LayoutGrid
}

// Mobile nav items for jugador
const jugadorNavItems = [
  { href: '/dashboard', icon: 'home', label: 'Inicio' },
  { href: '/dashboard/jugador/cupones', icon: 'confirmation_number', label: 'Cupones' },
  { href: '/dashboard/jugador/torneos', icon: 'emoji_events', label: 'Torneos' },
  { href: '/dashboard/jugador/perfil', icon: 'person', label: 'Perfil' },
]


// Función para obtener la ruta de "volver" basada en el pathname actual
function getBackRoute(pathname: string): string {
  // Rutas principales del jugador van a inicio
  const mainRoutes = [
    '/dashboard/jugador/cupones',
    '/dashboard/jugador/torneos',
    '/dashboard/jugador/perfil',
    '/dashboard/jugador/calendario',
    '/dashboard/jugador/documentos',
  ]

  // Si es una ruta principal, ir a inicio
  if (mainRoutes.includes(pathname)) {
    return '/dashboard'
  }

  // Si es una sub-ruta, ir a la ruta padre
  const segments = pathname.split('/')
  if (segments.length > 3) {
    segments.pop() // Quitar el último segmento
    return segments.join('/')
  }

  // Por defecto, ir a inicio
  return '/dashboard'
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore()
  const { toggleTheme } = useThemeStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const backRoute = getBackRoute(pathname)

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [_hasHydrated, isAuthenticated])

  if (!_hasHydrated || !user) return null

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    window.location.href = '/login'
  }

  // Si es jugador, usar layout responsive (mobile + desktop)
  if (user.role === 'jugador') {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        {/* Desktop Header - hidden on mobile */}
        <header className="hidden md:block sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex justify-between items-center h-14 px-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
              <span className="font-bold text-lg tracking-tight uppercase text-slate-900 dark:text-white">Seguro Deportivo</span>

              {/* Module Navigation - Desktop */}
              <nav className="flex items-center gap-1 p-1">
                {jugadorNavItems.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2  transition-all ${isActive
                        ? ' text-primary font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400'
                        }`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <Link
                href="/dashboard/notificaciones"
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-xl transition-colors relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/80 dark:ring-slate-900/80"></span>
              </Link>
            </div>

            {/* Back button - below navbar */}
            {pathname !== '/dashboard' && (
              <div className="mt-4">
                <button
                  onClick={() => router.push(backRoute)}
                  className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  <span className="text-sm font-medium">Volver</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Header - hidden on desktop */}
        <div className="md:hidden sticky top-0 z-50 p-3 sm:p-4 pb-2 max-w-[480px] mx-auto">
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5">
            <div className="flex size-9 shrink-0 items-center">
              {pathname !== '/dashboard' ? (
                <button
                  onClick={() => router.push(backRoute)}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white transition-colors hover:bg-white/80 dark:hover:bg-white/20"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
              ) : (
                <div className="size-9" />
              )}
            </div>
            <h2 className="text-slate-900 dark:text-white text-sm sm:text-base font-bold leading-tight flex-1 text-center uppercase tracking-[0.08em]">
              Seguro Deportivo
            </h2>
            <div className="flex w-9 items-center justify-end">
              <Link
                href="/dashboard/notificaciones"
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white transition-colors hover:bg-white/80 dark:hover:bg-white/20 relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/80"></span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="md:max-w-7xl md:mx-auto md:px-4 md:py-8 px-3 py-4 pb-24 md:pb-8 max-w-[480px] mx-auto md:max-w-none">
          {children}
        </main>

        {/* Bottom Navigation - mobile only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-6 max-w-[480px] mx-auto">
          <nav className="flex gap-1 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/10 px-2 py-2">
            {jugadorNavItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all ${isActive
                    ? 'text-primary bg-white/70 dark:bg-white/15 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/10'
                    }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <p className={`text-[9px] leading-normal tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </p>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    )
  }

  // Para admin, productor y club: layout con sidebar
  const navigation = getNavigationForRole(user.role)

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-900">
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
        w-56 sm:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Seguro Deportivo</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
            <p className="font-medium truncate text-slate-900 dark:text-white text-sm sm:text-base">{user.name}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = iconMap[item.icon] || Home
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base
                    ${isActive
                      ? 'bg-primary text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
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
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors w-full text-sm sm:text-base"
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
        <header className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-white"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Seguro Deportivo</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto text-slate-900 dark:text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
