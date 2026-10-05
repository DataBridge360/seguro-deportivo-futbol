export type UserRole = 'admin' | 'productor' | 'club' | 'jugador' | 'cantina' | 'developer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  debe_cambiar_password?: boolean
  // Club administrator: no puntos equivalence and no cajas
  acceso_limitado?: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface NavItem {
  label: string
  href: string
  icon: string
  materialIcon: string
  roles: UserRole[]
  // Hidden for profiles with acceso_limitado
  fullAccessOnly?: boolean
  // Extra path prefixes that also mark this item as active
  matchPaths?: string[]
}
