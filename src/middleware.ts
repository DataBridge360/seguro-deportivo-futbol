import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login', '/login/staff', '/registro', '/recuperar', '/restablecer']

// Rutas compartidas para todos los roles autenticados
const sharedRoutes = [/^\/dashboard\/notificaciones/]

const roleRoutePatterns: Record<string, RegExp[]> = {
  admin: [/^\/dashboard/, /^\/dashboard\/admin/],
  productor: [/^\/dashboard$/, /^\/dashboard\/productor/, ...sharedRoutes],
  club: [/^\/dashboard$/, /^\/dashboard\/club/, ...sharedRoutes],
  jugador: [/^\/dashboard$/, /^\/dashboard\/jugador/, ...sharedRoutes],
  cantina: [/^\/dashboard$/, /^\/dashboard\/cantina/, ...sharedRoutes],
  // developer usa las mismas vistas que productor
  developer: [/^\/dashboard$/, /^\/dashboard\/productor/, ...sharedRoutes],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const authCookie = request.cookies.get('auth-storage')

  let user = null
  if (authCookie?.value) {
    try {
      const parsed = JSON.parse(authCookie.value)
      user = parsed.state?.user
    } catch {
      // Cookie inválida
    }
  }

  if (publicRoutes.includes(pathname)) {
    // /restablecer must always work from an emailed link, even for a logged-in
    // user (e.g. session on another device), so it is intentionally excluded
    // from this redirect-away-when-authenticated behavior.
    if (user && (pathname.startsWith('/login') || pathname === '/registro' || pathname === '/recuperar')) {
      // Si viene de /dashboard, probablemente es un loop por token inválido
      // Limpiar cookie y permitir quedarse en login
      const referer = request.headers.get('referer') || ''
      if (referer.includes('/dashboard')) {
        const response = NextResponse.next()
        response.cookies.delete('auth-storage')
        return response
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  const defaultRoutes: Record<string, string> = {
    admin: '/dashboard',
    productor: '/dashboard/productor/jugadores',
    club: '/dashboard/club/torneos',
    jugador: '/dashboard',
    cantina: '/dashboard/cantina/cupones',
    developer: '/dashboard/productor/jugadores',
  }

  // Jugador con debe_cambiar_password=true: bloqueado en cualquier otra ruta
  // autenticada hasta que complete sus datos.
  const debeCompletarDatos = !!user && user.role === 'jugador' && user.debe_cambiar_password === true

  if (pathname === '/completar-datos') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!debeCompletarDatos) {
      return NextResponse.redirect(new URL(defaultRoutes[user.role] || '/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (debeCompletarDatos) {
      return NextResponse.redirect(new URL('/completar-datos', request.url))
    }

    const userRole = user.role

    // Redirect productor from /dashboard to jugadores
    if ((userRole === 'productor' || userRole === 'developer') && pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/productor/jugadores', request.url))
    }

    const allowedPatterns = roleRoutePatterns[userRole] || []

    const hasAccess = allowedPatterns.some(pattern => pattern.test(pathname))

    if (!hasAccess) {
      return NextResponse.redirect(new URL(defaultRoutes[userRole] || '/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
}
