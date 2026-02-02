export type UserRole = 'admin' | 'productor' | 'club' | 'jugador'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface NavItem {
  label: string
  href: string
  icon: string
  roles: UserRole[]
}
