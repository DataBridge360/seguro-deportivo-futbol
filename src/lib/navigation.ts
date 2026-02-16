import { NavItem, UserRole } from '@/types'

export const navigationItems: NavItem[] = [
  // Dashboard (todos)
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: 'Home',
    roles: ['admin', 'productor', 'club', 'jugador', 'cantina']
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
    label: 'Jugadores',
    href: '/dashboard/productor/jugadores',
    icon: 'Users',
    roles: ['productor']
  },
  {
    label: 'Carga Masiva',
    href: '/dashboard/productor/carga-masiva',
    icon: 'Upload',
    roles: ['productor']
  },
  {
    label: 'Perfil',
    href: '/dashboard/productor/perfil',
    icon: 'User',
    roles: ['productor']
  },

  // Club
  {
    label: 'Jugadores',
    href: '/dashboard/club/jugadores',
    icon: 'Users',
    roles: ['club']
  },
  {
    label: 'Equipos',
    href: '/dashboard/club/equipos',
    icon: 'Shield',
    roles: ['club']
  },
  {
    label: 'Torneos',
    href: '/dashboard/club/torneos',
    icon: 'Trophy',
    roles: ['club']
  },
  {
    label: 'Categorias',
    href: '/dashboard/club/categorias',
    icon: 'LayoutGrid',
    roles: ['club']
  },
  {
    label: 'Calendario',
    href: '/dashboard/club/calendario',
    icon: 'Calendar',
    roles: ['club']
  },
  {
    label: 'Notificaciones',
    href: '/dashboard/club/notificaciones',
    icon: 'Bell',
    roles: ['club']
  },
  {
    label: 'Perfil',
    href: '/dashboard/club/perfil',
    icon: 'User',
    roles: ['club']
  },

  // Jugador
  {
    label: 'Cupones',
    href: '/dashboard/jugador/cupones',
    icon: 'Ticket',
    roles: ['jugador']
  },
  {
    label: 'Torneos',
    href: '/dashboard/jugador/torneos',
    icon: 'Trophy',
    roles: ['jugador']
  },
  {
    label: 'Calendario',
    href: '/dashboard/jugador/calendario',
    icon: 'Calendar',
    roles: ['jugador']
  },
  {
    label: 'Documentos',
    href: '/dashboard/jugador/documentos',
    icon: 'FileText',
    roles: ['jugador']
  },
  {
    label: 'Perfil',
    href: '/dashboard/jugador/perfil',
    icon: 'User',
    roles: ['jugador']
  },

  // Cantina
  {
    label: 'Validar Cupones',
    href: '/dashboard/cantina/cupones',
    icon: 'ScanLine',
    roles: ['cantina']
  },
  {
    label: 'Cierre de Caja',
    href: '/dashboard/cantina/cierre',
    icon: 'Calculator',
    roles: ['cantina']
  },
  {
    label: 'Notificaciones',
    href: '/dashboard/cantina/notificaciones',
    icon: 'Bell',
    roles: ['cantina']
  },
  {
    label: 'Perfil',
    href: '/dashboard/cantina/perfil',
    icon: 'User',
    roles: ['cantina']
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
      return '/dashboard/productor/jugadores'
    case 'club':
      return '/dashboard'
    case 'jugador':
      return '/dashboard'
    case 'cantina':
      return '/dashboard/cantina/cupones'
    default:
      return '/dashboard'
  }
}

export const roleRoutes: Record<UserRole, string[]> = {
  admin: ['/dashboard', '/dashboard/admin'],
  productor: ['/dashboard', '/dashboard/productor'],
  club: ['/dashboard', '/dashboard/club'],
  jugador: ['/dashboard', '/dashboard/jugador'],
  cantina: ['/dashboard', '/dashboard/cantina'],
}
