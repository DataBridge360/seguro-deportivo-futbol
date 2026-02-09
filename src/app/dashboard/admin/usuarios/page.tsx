'use client'

import { useState } from 'react'

type UserRole = 'admin' | 'productor' | 'club' | 'jugador' | 'cantina'

interface MockUser {
  id: string
  nombre: string
  email: string
  role: UserRole
  estado: 'activo' | 'inactivo'
}

const MOCK_ADMIN_USERS: MockUser[] = [
  { id: '1', nombre: 'Administrador', email: 'admin@test.com', role: 'admin', estado: 'activo' },
  { id: '2', nombre: 'Juan Productor', email: 'productor@test.com', role: 'productor', estado: 'activo' },
  { id: '3', nombre: 'Club Atlético', email: 'club@test.com', role: 'club', estado: 'activo' },
  { id: '4', nombre: 'Carlos Jugador', email: 'jugador@test.com', role: 'jugador', estado: 'activo' },
  { id: '5', nombre: 'Cantina Central', email: 'cantina@test.com', role: 'cantina', estado: 'activo' },
  { id: '6', nombre: 'María López', email: 'maria@test.com', role: 'jugador', estado: 'activo' },
  { id: '7', nombre: 'Pedro García', email: 'pedro@test.com', role: 'productor', estado: 'inactivo' },
  { id: '8', nombre: 'Club Deportivo Norte', email: 'clubnorte@test.com', role: 'club', estado: 'activo' },
]

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  productor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  club: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  jugador: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  cantina: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
}

export default function AdminUsuariosPage() {
  const [filtroRol, setFiltroRol] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')

  const filtered = MOCK_ADMIN_USERS.filter(u => {
    const matchRol = filtroRol === 'todos' || u.role === filtroRol
    const matchBusqueda = !busqueda || u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase())
    return matchRol && matchBusqueda
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestiona los usuarios del sistema</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="productor">Productor</option>
          <option value="club">Club</option>
          <option value="jugador">Jugador</option>
          <option value="cantina">Cantina</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{user.nombre}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 sm:hidden">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${roleColors[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user.estado === 'activo'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
                  }`}>
                    {user.estado === 'activo' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No se encontraron usuarios
          </div>
        )}
      </div>
    </div>
  )
}
