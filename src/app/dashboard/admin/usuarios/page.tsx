'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AdminManagedUser,
  AdminUserRole,
  createAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  getClubs,
} from '@/lib/api'
import type { Club } from '@/types/bulk-import'

type RoleFilter = AdminUserRole | 'todos'
type ModalMode = 'create' | 'edit' | 'password' | null

const roleLabels: Record<AdminUserRole, string> = {
  admin: 'Admin',
  productor: 'Productor',
  club: 'Club',
  jugador: 'Jugador',
  cantina: 'Cantina',
  developer: 'Developer',
}

const roleColors: Record<AdminUserRole, string> = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  productor: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  club: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  jugador: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  cantina: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  developer: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
}

const emptyForm = {
  role: 'productor' as AdminUserRole,
  nombre: '',
  apellido: '',
  usuario: '',
  dni: '',
  email: '',
  telefono: '',
  direccion: '',
  fecha_nacimiento: '',
  club_id: '',
  password: '',
  activo: true,
  pagado: false,
  admin_password: '',
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [filtroRol, setFiltroRol] = useState<RoleFilter>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [counts, setCounts] = useState({ staff: 0, jugadores: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<AdminManagedUser | null>(null)
  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersData, clubsData] = await Promise.all([
        getAdminUsers({ search: busqueda, role: filtroRol, page, limit: 10 }),
        getClubs(),
      ])
      setUsers(usersData.data)
      setTotal(usersData.total)
      setTotalPages(usersData.totalPages)
      setCounts(usersData.counts)
      setClubs(clubsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [busqueda, filtroRol, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => ({
    total,
    activos: users.filter(user => user.activo).length,
    jugadores: counts.jugadores,
    staff: counts.staff,
  }), [counts.jugadores, counts.staff, total, users])

  const setField = (field: keyof typeof emptyForm, value: string | boolean) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const openCreate = () => {
    setSelected(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
    setModalMode('create')
  }

  const openEdit = (user: AdminManagedUser) => {
    setSelected(user)
    setForm({
      ...emptyForm,
      role: user.role,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      usuario: user.usuario || '',
      dni: user.dni || '',
      email: user.email || '',
      telefono: user.telefono || '',
      direccion: user.direccion || '',
      fecha_nacimiento: user.fecha_nacimiento || '',
      club_id: user.club_id || '',
      activo: user.activo,
      pagado: Boolean(user.pagado),
    })
    setError('')
    setSuccess('')
    setModalMode('edit')
  }

  const openPassword = (user: AdminManagedUser) => {
    setSelected(user)
    setForm({ ...emptyForm, password: '', admin_password: '' })
    setError('')
    setSuccess('')
    setModalMode('password')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelected(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (modalMode === 'create') {
        await createAdminUser({
          role: form.role,
          nombre: form.nombre,
          apellido: form.role === 'jugador' ? form.apellido : undefined,
          dni: form.role === 'jugador' ? form.dni : undefined,
          fecha_nacimiento: form.role === 'jugador' ? form.fecha_nacimiento : undefined,
          usuario: form.role !== 'jugador' ? form.usuario : undefined,
          email: form.email || undefined,
          telefono: form.telefono || undefined,
          direccion: form.direccion || undefined,
          club_id: form.club_id || undefined,
          password: form.password,
          activo: form.activo,
          admin_password: form.admin_password,
        })
        setPage(1)
        await loadData()
        setSuccess('Usuario creado')
        closeModal()
      }

      if (modalMode === 'edit' && selected) {
        await updateAdminUser(selected.kind, selected.id, {
          nombre: form.nombre,
          apellido: selected.kind === 'jugador' ? form.apellido : undefined,
          dni: selected.kind === 'jugador' ? form.dni : undefined,
          fecha_nacimiento: selected.kind === 'jugador' ? form.fecha_nacimiento : undefined,
          usuario: selected.kind === 'staff' ? form.usuario : undefined,
          email: form.email || '',
          telefono: selected.kind === 'jugador' ? form.telefono : undefined,
          direccion: selected.kind === 'jugador' ? form.direccion : undefined,
          club_id: form.club_id || undefined,
          activo: form.activo,
          pagado: selected.kind === 'jugador' ? form.pagado : undefined,
          admin_password: form.admin_password,
        })
        await loadData()
        setSuccess('Usuario actualizado')
        closeModal()
      }

      if (modalMode === 'password' && selected) {
        await resetAdminUserPassword(selected.kind, selected.id, {
          password: form.password,
          admin_password: form.admin_password,
        })
        await loadData()
        setSuccess('Contraseña actualizada')
        closeModal()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const showClub = form.role !== 'admin'
  const showJugadorFields = form.role === 'jugador' || selected?.kind === 'jugador'
  const showStaffFields = modalMode === 'create' ? form.role !== 'jugador' : selected?.kind === 'staff'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Administracion de accesos y jugadores</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Nuevo usuario
        </button>
      </div>

      {(error || success) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${
          error
            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300'
            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-300'
        }`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Total', stats.total, 'group'],
          ['Activos en pagina', stats.activos, 'verified_user'],
          ['Staff', stats.staff, 'admin_panel_settings'],
          ['Jugadores', stats.jugadores, 'sports_soccer'],
        ].map(([label, value, icon]) => (
          <div key={String(label)} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
              <span className="material-symbols-outlined text-slate-400 text-xl">{icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por nombre, DNI, usuario, email o club"
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => {
            setFiltroRol(e.target.value as RoleFilter)
            setPage(1)
          }}
          className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
        >
          <option value="todos">Todos los roles</option>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={loadData}
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Actualizar"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Acceso</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Club</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">Cargando usuarios...</td>
              </tr>
            ) : users.map((user) => (
              <tr key={`${user.kind}-${user.id}`} className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3 min-w-[220px]">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.apellido ? `${user.apellido} ${user.nombre}` : user.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.kind === 'jugador' ? `DNI ${user.dni || '-'}` : user.email || '-'}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                  {user.usuario || user.email || user.dni || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                  {user.club_nombre || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    user.activo
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
                  }`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => openPassword(user)}
                      className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Cambiar contraseña"
                    >
                      <span className="material-symbols-outlined text-lg">lock_reset</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No se encontraron usuarios
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
        <p className="text-slate-500 dark:text-slate-400">
          Mostrando {users.length === 0 ? 0 : (page - 1) * 10 + 1}-{Math.min(page * 10, total)} de {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
            Anterior
          </button>
          <span className="px-3 py-2 text-slate-600 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(current => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 disabled:opacity-50"
          >
            Siguiente
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' && 'Nuevo usuario'}
                {modalMode === 'edit' && 'Editar usuario'}
                {modalMode === 'password' && 'Cambiar contraseña'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setField('role', e.target.value as AdminUserRole)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {modalMode !== 'password' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Nombre" value={form.nombre} onChange={value => setField('nombre', value)} required />
                  {showJugadorFields && (
                    <Input label="Apellido" value={form.apellido} onChange={value => setField('apellido', value)} required />
                  )}
                  {showStaffFields && (
                    <Input label="Usuario" value={form.usuario} onChange={value => setField('usuario', value)} required />
                  )}
                  {showJugadorFields && (
                    <>
                      <Input label="DNI" value={form.dni} onChange={value => setField('dni', value)} required />
                      <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={value => setField('fecha_nacimiento', value)} required />
                    </>
                  )}
                  <Input label="Email" type="email" value={form.email} onChange={value => setField('email', value)} />
                  {showJugadorFields && (
                    <>
                      <Input label="Telefono" value={form.telefono} onChange={value => setField('telefono', value)} />
                      <Input label="Direccion" value={form.direccion} onChange={value => setField('direccion', value)} />
                    </>
                  )}
                  {showClub && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Club</label>
                      <select
                        value={form.club_id}
                        onChange={(e) => setField('club_id', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                        required={form.role !== 'admin'}
                      >
                        <option value="">Seleccionar club</option>
                        {clubs.map(club => (
                          <option key={club.id} value={club.id}>{club.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {modalMode === 'create' && (
                <Input label="Contraseña inicial" type="password" value={form.password} onChange={value => setField('password', value)} required />
              )}

              {modalMode === 'password' && (
                <Input label="Nueva contraseña" type="password" value={form.password} onChange={value => setField('password', value)} required />
              )}

              {modalMode === 'edit' && (
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setField('activo', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    Activo
                  </label>
                  {selected?.kind === 'jugador' && (
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={form.pagado}
                        onChange={(e) => setField('pagado', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      Seguro pagado
                    </label>
                  )}
                </div>
              )}

              <Input label="Contraseña del admin" type="password" value={form.admin_password} onChange={value => setField('admin_password', value)} required />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg">{modalMode === 'password' ? 'lock_reset' : 'save'}</span>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
      />
    </div>
  )
}
