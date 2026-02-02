import { NavItem, UserRole } from '@/types'

export const navigationItems: NavItem[] = [
  // Dashboard (todos)
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: 'Home',
    roles: ['admin', 'productor', 'club', 'jugador']
  },

  // Admin
  {
    label: 'Usuarios',
    href: '/dashboard/admin/usuarios',
    icon: 'Users',
    roles: ['admin']
  },
  {
    label: 'Reportes',
    href: '/dashboard/admin/reportes',
    icon: 'BarChart3',
    roles: ['admin']
  },
  {
    label: 'Configuración',
    href: '/dashboard/admin/configuracion',
    icon: 'Settings',
    roles: ['admin']
  },

  // Productor
  {
    label: 'Mis Clubs',
    href: '/dashboard/productor/clubs',
    icon: 'Building2',
    roles: ['productor']
  },
  {
    label: 'Jugadores',
    href: '/dashboard/productor/jugadores',
    icon: 'Users',
    roles: ['productor']
  },
  {
    label: 'Pólizas',
    href: '/dashboard/productor/polizas',
    icon: 'FileText',
    roles: ['productor']
  },

  // Club
  {
    label: 'Mi Club',
    href: '/dashboard/club/mi-club',
    icon: 'Building2',
    roles: ['club']
  },
  {
    label: 'Jugadores',
    href: '/dashboard/club/jugadores',
    icon: 'Users',
    roles: ['club']
  },
  {
    label: 'Pólizas',
    href: '/dashboard/club/polizas',
    icon: 'FileText',
    roles: ['club']
  },

  // Jugador
  {
    label: 'Mi Perfil',
    href: '/dashboard/jugador/mi-perfil',
    icon: 'User',
    roles: ['jugador']
  },
  {
    label: 'Mi Póliza',
    href: '/dashboard/jugador/mi-poliza',
    icon: 'FileText',
    roles: ['jugador']
  },
]

export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigationItems.filter(item => item.roles.includes(role))
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard'
    case 'productor':
      return '/dashboard/productor/clubs'
    case 'club':
      return '/dashboard/club/mi-club'
    case 'jugador':
      return '/dashboard'
    default:
      return '/dashboard'
  }
}

export const roleRoutes: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/dashboard/admin'],
  productor: ['/dashboard', '/dashboard/productor'],
  club: ['/dashboard', '/dashboard/club'],
  jugador: ['/dashboard', '/dashboard/jugador'],
}
