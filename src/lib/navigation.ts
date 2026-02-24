import { NavItem, UserRole } from '@/types'

export const navigationItems: NavItem[] = [
  // Dashboard (todos menos productor)
  {
    label: 'Inicio',
    href: '/dashboard',
    icon: 'Home',
    materialIcon: 'home',
    roles: ['admin', 'club', 'jugador', 'cantina']
  },

  // Admin
  {
    label: 'Usuarios',
    href: '/dashboard/admin/usuarios',
    icon: 'Users',
    materialIcon: 'group',
    roles: ['admin']
  },
  {
    label: 'Reportes',
    href: '/dashboard/admin/reportes',
    icon: 'BarChart3',
    materialIcon: 'bar_chart',
    roles: ['admin']
  },
  {
    label: 'Configuración',
    href: '/dashboard/admin/configuracion',
    icon: 'Settings',
    materialIcon: 'settings',
    roles: ['admin']
  },

  // Productor
  {
    label: 'Jugadores',
    href: '/dashboard/productor/jugadores',
    icon: 'Users',
    materialIcon: 'groups',
    roles: ['productor']
  },
  {
    label: 'Perfil',
    href: '/dashboard/productor/perfil',
    icon: 'User',
    materialIcon: 'person',
    roles: ['productor']
  },

  // Club
  {
    label: 'Jugadores',
    href: '/dashboard/club/jugadores',
    icon: 'Users',
    materialIcon: 'groups',
    roles: ['club']
  },
  {
    label: 'Equipos',
    href: '/dashboard/club/equipos',
    icon: 'Shield',
    materialIcon: 'shield',
    roles: ['club']
  },
  {
    label: 'Torneos',
    href: '/dashboard/club/torneos',
    icon: 'Trophy',
    materialIcon: 'emoji_events',
    roles: ['club']
  },
  {
    label: 'Notificaciones',
    href: '/dashboard/club/notificaciones',
    icon: 'Bell',
    materialIcon: 'notifications',
    roles: ['club']
  },
  {
    label: 'Perfil',
    href: '/dashboard/club/perfil',
    icon: 'User',
    materialIcon: 'person',
    roles: ['club']
  },

  // Jugador
  {
    label: 'Cupones',
    href: '/dashboard/jugador/cupones',
    icon: 'Ticket',
    materialIcon: 'confirmation_number',
    roles: ['jugador']
  },
  {
    label: 'Torneos',
    href: '/dashboard/jugador/torneos',
    icon: 'Trophy',
    materialIcon: 'emoji_events',
    roles: ['jugador']
  },
  {
    label: 'Documentos',
    href: '/dashboard/jugador/documentos',
    icon: 'FileText',
    materialIcon: 'description',
    roles: ['jugador']
  },
  {
    label: 'Perfil',
    href: '/dashboard/jugador/perfil',
    icon: 'User',
    materialIcon: 'person',
    roles: ['jugador']
  },

  // Cantina
  {
    label: 'Validar Cupones',
    href: '/dashboard/cantina/cupones',
    icon: 'ScanLine',
    materialIcon: 'qr_code_scanner',
    roles: ['cantina']
  },
  {
    label: 'Cierre de Caja',
    href: '/dashboard/cantina/cierre',
    icon: 'Calculator',
    materialIcon: 'point_of_sale',
    roles: ['cantina']
  },
  {
    label: 'Notificaciones',
    href: '/dashboard/cantina/notificaciones',
    icon: 'Bell',
    materialIcon: 'notifications',
    roles: ['cantina']
  },
  {
    label: 'Perfil',
    href: '/dashboard/cantina/perfil',
    icon: 'User',
    materialIcon: 'person',
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
