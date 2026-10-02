'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { getNavigationForRole } from '@/lib/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getNoLeidasCount } from '@/lib/api'
import NotificationPermissionBanner from '@/components/NotificationPermissionBanner'
import { useSessionRefresh } from '@/hooks/useSessionRefresh'
import { useSilentFCMRegistration } from '@/hooks/useFCMToken'
import FCMMessageListener from '@/components/FCMMessageListener'
import ThemeToggle from '@/components/ui/ThemeToggle'

// Mobile nav items for jugador
const jugadorNavItems = [
  { href: '/dashboard', icon: 'home', label: 'Inicio' },
  { href: '/dashboard/jugador/cupones', icon: 'confirmation_number', label: 'Cupones' },
  { href: '/dashboard/jugador/torneos', icon: 'emoji_events', label: 'Torneos' },
  { href: '/dashboard/jugador/puntos', icon: 'stars', label: 'Puntos' },
  { href: '/dashboard/jugador/perfil', icon: 'person', label: 'Perfil' },
]

function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
}


// Función para obtener la ruta de "volver" basada en el pathname actual
function getBackRoute(pathname: string): string {
  // Rutas principales del jugador van a inicio
  const mainRoutes = [
    '/dashboard/jugador/cupones',
    '/dashboard/jugador/torneos',
    '/dashboard/jugador/puntos',
    '/dashboard/jugador/perfil',
    '/dashboard/jugador/documentos',
  ]

  // Si es una ruta principal, ir a inicio
  if (mainRoutes.includes(pathname)) {
    return '/dashboard'
  }

  // Rutas de equipo dentro de torneo: /torneos/[id]/equipo/[equipoId] → /torneos
  if (/\/dashboard\/jugador\/torneos\/[^/]+\/equipo\/[^/]+/.test(pathname)) {
    return '/dashboard/jugador/torneos'
  }

  if (/\/dashboard\/jugador\/anuncios\/[^/]+/.test(pathname)) {
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
  useThemeStore()
  useSessionRefresh()
  useSilentFCMRegistration()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const backRoute = getBackRoute(pathname)
  const activeNavIndex = jugadorNavItems.findIndex((item) => isNavItemActive(pathname, item.href))
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(() => {
    if (_hasHydrated && isAuthenticated && user?.role === 'jugador') {
      getNoLeidasCount().then(setUnreadCount).catch(() => {})
    }
  }, [_hasHydrated, isAuthenticated, user?.role])

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [_hasHydrated, isAuthenticated])

  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user?.role === 'jugador' && user.debe_cambiar_password) {
      window.location.replace('/completar-datos')
    }
  }, [_hasHydrated, isAuthenticated, user])

  useEffect(() => {
    fetchUnreadCount()
    unreadIntervalRef.current = setInterval(fetchUnreadCount, 30000)
    const onRead = () => fetchUnreadCount()
    window.addEventListener('notifications:read', onRead)
    return () => {
      if (unreadIntervalRef.current) clearInterval(unreadIntervalRef.current)
      window.removeEventListener('notifications:read', onRead)
    }
  }, [fetchUnreadCount])

  if (!_hasHydrated || !user) return null

  if (user.role === 'jugador' && user.debe_cambiar_password) return null

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
            <div
              className="flex justify-between items-center h-16 px-6 rounded-2xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl text-slate-900 dark:text-white ring-1 ring-slate-200/80 dark:ring-white/10 shadow-lg"
              style={{
                boxShadow: '0 16px 32px -12px rgba(19, 146, 236, 0.22)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full bg-white p-0.5 ring-2 ring-primary/25 shadow">
                  <Image
                    src="/logo.png"
                    alt="Logo del Club"
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Complejo Deportivo</h1>
                  <p className="text-[10px] text-primary dark:text-sky-300 font-bold uppercase tracking-wide">Plaza Huincul</p>
                </div>
              </div>

              {/* Module Navigation - Desktop */}
              <nav className="flex items-center gap-1 p-1">
                {jugadorNavItems.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl transition-all ${isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 dark:hover:bg-white/10'
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

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                  href="/dashboard/notificaciones"
                  aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
                  className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 transition-colors relative"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>
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
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white/85 dark:bg-slate-900/75 backdrop-blur-xl text-slate-900 dark:text-white ring-1 ring-slate-200/80 dark:ring-white/10 shadow-lg"
            style={{
              boxShadow: '0 12px 24px -10px rgba(19, 146, 236, 0.22)',
            }}
          >
            {pathname !== '/dashboard' ? (
              <>
                <div className="flex size-10 shrink-0 items-center">
                  <button
                    onClick={() => router.push(backRoute)}
                    className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                  <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-0.5 ring-2 ring-primary/25 shadow">
                    <Image
                      src="/logo.png"
                      alt="Logo del Club"
                      width={44}
                      height={44}
                      className="size-11 rounded-full object-cover"
                    />
                  </div>
                  <div className="leading-tight min-w-0">
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">Complejo Deportivo</h1>
                    <p className="text-[9px] text-primary dark:text-sky-300 font-bold uppercase tracking-wide">Plaza Huincul</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex shrink-0 items-center justify-center rounded-full bg-white p-0.5 ring-2 ring-primary/25 shadow">
                  <Image
                    src="/logo.png"
                    alt="Logo del Club"
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                </div>
                <div className="leading-tight min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">Complejo Deportivo</h1>
                  <p className="text-[9px] text-primary dark:text-sky-300 font-bold uppercase tracking-wide">Plaza Huincul</p>
                </div>
              </div>
            )}
            <div className="flex shrink-0 items-center justify-end gap-2">
              <ThemeToggle />
              <Link
                href="/dashboard/notificaciones"
                aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
                className="flex size-10 cursor-pointer items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors hover:bg-primary/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="md:max-w-7xl md:mx-auto md:px-4 md:py-8 px-3 py-4 pb-28 md:pb-16 max-w-[480px] mx-auto md:max-w-none">
          {children}
        </main>

        {/* Bottom Navigation - mobile only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-[480px] mx-auto pointer-events-none">
          <nav
            aria-label="Navegación principal"
            className="pointer-events-auto relative flex rounded-[26px] bg-white/85 dark:bg-slate-900/80 backdrop-blur-xl ring-1 ring-slate-200/80 dark:ring-white/10 p-1.5"
            style={{ boxShadow: '0 16px 32px -12px rgba(19, 146, 236, 0.28)' }}
          >
            {activeNavIndex >= 0 && (
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 pointer-events-none"
                style={{ width: `calc((100% - 0.75rem) / ${jugadorNavItems.length})` }}
              >
                <span
                  className="block h-full w-full rounded-[20px] bg-primary/10 dark:bg-primary/20 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${activeNavIndex * 100}%)` }}
                />
              </span>
            )}
            {jugadorNavItems.map((item) => {
              const isActive = isNavItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-[20px] transition-all duration-200 active:scale-95 ${isActive
                    ? 'text-primary dark:text-sky-300'
                    : 'text-slate-500 dark:text-slate-400'
                    }`}
                >
                  <span
                    className={`material-symbols-outlined text-[24px] transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className={`max-w-full truncate px-0.5 text-[10px] leading-tight transition-colors duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* FCM Message Listener - solo UNA VEZ */}
        <FCMMessageListener />

        {/* Notification Permission Banner */}
        <NotificationPermissionBanner />
      </div>
    )
  }

  // Para admin, productor y club: layout con sidebar estilo mockup
  const navigation = getNavigationForRole(user.role, user.acceso_limitado === true)

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
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        w-64 border-r border-slate-200 dark:border-white/[0.06] flex flex-col h-screen
        bg-white dark:bg-slate-950
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
              <ThemeToggle variant="plain" />
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
        <header className="lg:hidden h-16 border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 flex items-center gap-4">
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
          <ThemeToggle variant="plain" className="ml-auto" />
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-12 sm:pb-14 lg:pb-16 overflow-auto text-slate-900 dark:text-white">
          {children}
        </div>
      </main>
    </div>
  )
}
