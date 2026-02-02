import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/', '/login']

const roleRoutePatterns: Record<string, RegExp[]> = {
  admin: [/^\/dashboard/, /^\/dashboard\/admin/],
  productor: [/^\/dashboard$/, /^\/dashboard\/productor/],
  club: [/^\/dashboard$/, /^\/dashboard\/club/],
  jugador: [/^\/dashboard$/, /^\/dashboard\/jugador/],
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
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const userRole = user.role
    const allowedPatterns = roleRoutePatterns[userRole] || []

    const hasAccess = allowedPatterns.some(pattern => pattern.test(pathname))

    if (!hasAccess) {
      const defaultRoutes: Record<string, string> = {
        admin: '/dashboard',
        productor: '/dashboard/productor/clubs',
        club: '/dashboard/club/mi-club',
        jugador: '/dashboard',
      }
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
