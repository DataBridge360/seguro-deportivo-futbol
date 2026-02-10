export type UserRole = 'admin' | 'productor' | 'club' | 'jugador' | 'cantina'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: User
}

export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}
