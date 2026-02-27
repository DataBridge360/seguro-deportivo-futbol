'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { getNavigationForRole } from '@/lib/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getNoLeidasCount } from '@/lib/api'

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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [_hasHydrated, isAuthenticated])

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user?.role === 'jugador') {
      getNoLeidasCount().then(setUnreadCount).catch(() => {})
    }
  }, [_hasHydrated, isAuthenticated, user?.role, pathname])

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
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="Logo del Club"
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">Complejo Deportivo</h1>
                  <p className="text-[10px] text-primary font-bold">Plaza Huincul</p>
                </div>
              </div>

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
                {unreadCount > 0 && <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/80 dark:ring-slate-900/80"></span>}
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
            <div className="flex items-center gap-2 flex-1 justify-center">
              <Image
                src="/logo.png"
                alt="Logo del Club"
                width={28}
                height={28}
                className="size-7 rounded-full object-cover"
              />
              <div className="leading-tight">
                <h1 className="text-xs font-bold text-slate-900 dark:text-white">Complejo Deportivo</h1>
                <p className="text-[9px] text-primary font-bold">Plaza Huincul</p>
              </div>
            </div>
            <div className="flex w-9 items-center justify-end">
              <Link
                href="/dashboard/notificaciones"
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl bg-white/60 dark:bg-white/10 text-slate-700 dark:text-white transition-colors hover:bg-white/80 dark:hover:bg-white/20 relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/80"></span>}
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

  // Para admin, productor y club: layout con sidebar estilo mockup
  const navigation = getNavigationForRole(user.role)

  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 border-r border-slate-200 dark:border-white/[0.06] flex flex-col h-screen lg:h-auto
        bg-white dark:bg-[#111111]
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile: close button / Desktop: logo */}
          <div className="p-6">
            {/* Close button - mobile only */}
            <div className="flex lg:hidden justify-end">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            {/* Logo - desktop only */}
            <div className="hidden lg:flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo del Club"
                width={44}
                height={44}
                className="size-11 rounded-full object-cover"
              />
              <div>
                <h1 className="text-sm font-bold leading-tight tracking-tight text-slate-900 dark:text-white">Complejo Deportivo</h1>
                <p className="text-xs text-primary font-bold">Plaza Huincul</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive
                      ? 'bg-primary/[0.15] text-primary border-r-[3px] border-primary'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                    }
                  `}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.materialIcon}</span>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 p-2">
              <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-primary/20">
                <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-lg">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="material-symbols-outlined text-slate-400 text-lg cursor-pointer hover:text-primary transition-colors"
                title="Cerrar sesión"
              >
                logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-slate-700 dark:text-white"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Logo del Club"
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
            />
            <div className="leading-tight">
              <h1 className="font-bold text-xs text-slate-900 dark:text-white">Complejo Deportivo</h1>
              <p className="text-[10px] text-primary font-bold">Plaza Huincul</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto text-slate-900 dark:text-white">
          {children}
        </div>
      </main>
    </div>
  )
}
