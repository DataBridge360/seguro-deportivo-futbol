'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { MOCK_JUGADORES as MOCK_JUGADORES_BASE, MOCK_CLUBS, EQUIPOS_NOMBRES, formatDate, isSeguroVigente } from '@/lib/mockData'
import type { JugadorAsegurado } from '@/lib/mockData'

export default function ProductorJugadoresPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [jugadores, setJugadores] = useState<JugadorAsegurado[]>(MOCK_JUGADORES_BASE)
  const [filtroClub, setFiltroClub] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Modal de eliminación
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; jugador: JugadorAsegurado | null }>({ open: false, jugador: null })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Modal de renovación
  const [renewModal, setRenewModal] = useState<{ open: boolean; jugador: JugadorAsegurado | null }>({ open: false, jugador: null })
  const [renewInicio, setRenewInicio] = useState('')
  const [renewDuracion, setRenewDuracion] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('anual')

  // Modal de notificación
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const jugadoresFiltrados = useMemo(() => {
    return jugadores.filter(j => {
      const matchClub = !filtroClub || j.clubId === filtroClub
      const search = busqueda.toLowerCase()
      const matchBusqueda = !busqueda || j.nombreCompleto.toLowerCase().includes(search) || j.dni.includes(search)
      const vigente = isSeguroVigente(j.seguroFin)
      const matchEstado = !filtroEstado || (filtroEstado === 'vigente' && vigente) || (filtroEstado === 'vencido' && !vigente)
      return matchClub && matchBusqueda && matchEstado
    })
  }, [jugadores, filtroClub, filtroEstado, busqueda])

  // Eliminación
  const handleDeleteClick = (jugador: JugadorAsegurado) => {
    setDeleteModal({ open: true, jugador })
    setDeletePassword('')
    setDeleteError('')
  }

  const handleDeleteConfirm = () => {
    if (deletePassword !== 'test') {
      setDeleteError('Contraseña incorrecta')
      return
    }
    if (deleteModal.jugador) {
      const nombre = deleteModal.jugador.nombreCompleto
      setJugadores(prev => prev.filter(j => j.id !== deleteModal.jugador!.id))
      setDeleteModal({ open: false, jugador: null })
      setNotification({
        open: true,
        title: 'Jugador eliminado',
        message: `${nombre} fue eliminado correctamente.`,
        type: 'success'
      })
    }
  }

  // Renovación
  const handleRenewClick = (jugador: JugadorAsegurado) => {
    setRenewModal({ open: true, jugador })
    setRenewInicio(new Date().toISOString().split('T')[0])
    setRenewDuracion('anual')
  }

  const calcRenewFin = (inicio: string, duracion: string): string => {
    if (!inicio) return ''
    const d = new Date(inicio + 'T00:00:00')
    switch (duracion) {
      case 'mensual': d.setMonth(d.getMonth() + 1); break
      case 'trimestral': d.setMonth(d.getMonth() + 3); break
      case 'semestral': d.setMonth(d.getMonth() + 6); break
      case 'anual': d.setFullYear(d.getFullYear() + 1); break
    }
    return d.toISOString().split('T')[0]
  }

  const handleRenewConfirm = () => {
    if (!renewModal.jugador || !renewInicio) return
    const jugador = renewModal.jugador
    const newEndStr = calcRenewFin(renewInicio, renewDuracion)

    setJugadores(prev => prev.map(j =>
      j.id === jugador.id ? { ...j, seguroInicio: renewInicio, seguroFin: newEndStr } : j
    ))
    setRenewModal({ open: false, jugador: null })
    setNotification({
      open: true,
      title: 'Seguro renovado',
      message: `El seguro de ${jugador.nombreCompleto} se renovó desde el ${formatDate(renewInicio)} hasta el ${formatDate(newEndStr)}.`,
      type: 'success'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jugadores Asegurados</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestión de jugadores y pólizas de seguro</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/productor/jugadores/nuevo')}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
        >
          <Users className="w-4 h-4" />
          Nuevo Jugador
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroClub}
          onChange={(e) => setFiltroClub(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary min-w-[200px]"
        >
          <option value="">Todos los clubs</option>
          {MOCK_CLUBS.map(club => (
            <option key={club.id} value={club.id}>{club.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary min-w-[160px]"
        >
          <option value="">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="vencido">Sin seguro</option>
        </select>
      </div>

      {/* Contador */}
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        {jugadoresFiltrados.length} jugador{jugadoresFiltrados.length !== 1 ? 'es' : ''}
      </p>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Club</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Vigencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {jugadoresFiltrados.map((jugador) => {
              const vigente = isSeguroVigente(jugador.seguroFin)
              return (
                <tr key={jugador.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{jugador.nombreCompleto}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs md:hidden">{jugador.club}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{jugador.dni}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">{jugador.club}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    {formatDate(jugador.seguroInicio)} - {formatDate(jugador.seguroFin)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${vigente
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${vigente ? 'bg-green-400' : 'bg-red-400'}`} />
                      {vigente ? 'Vigente' : 'Vencido'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/productor/jugadores/${jugador.id}`)}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRenewClick(jugador)}
                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Renovar seguro"
                      >
                        <ShieldRenew className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(jugador)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {jugadoresFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  No se encontraron jugadores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Eliminación con Contraseña */}
      {deleteModal.open && deleteModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteModal({ open: false, jugador: null })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 p-3 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-2">Eliminar jugador</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-4">
              ¿Estás seguro de eliminar a <strong className="text-slate-900 dark:text-white">{deleteModal.jugador.nombreCompleto}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Ingresá tu contraseña para confirmar</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Contraseña"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteConfirm() }}
              />
              {deleteError && (
                <p className="text-red-400 text-xs mt-1.5">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renovación */}
      {renewModal.open && renewModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setRenewModal({ open: false, jugador: null })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 p-3 rounded-full">
                <ShieldRenew className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">Renovar seguro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              <strong className="text-slate-900 dark:text-white">{renewModal.jugador.nombreCompleto}</strong>
            </p>

            {/* Fecha de inicio */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de inicio de vigencia</label>
              <DatePicker
                value={renewInicio}
                onChange={setRenewInicio}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Duración */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">Duración del seguro</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'mensual', label: 'Mensual', desc: '1 mes' },
                  { value: 'trimestral', label: 'Trimestral', desc: '3 meses' },
                  { value: 'semestral', label: 'Semestral', desc: '6 meses' },
                  { value: 'anual', label: 'Anual', desc: '12 meses' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRenewDuracion(opt.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      renewDuracion === opt.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      renewDuracion === opt.value ? 'border-green-500' : 'border-slate-400 dark:border-slate-500'
                    }`}>
                      {renewDuracion === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${renewDuracion === opt.value ? 'text-green-400' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {renewInicio && (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Inicio:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{formatDate(renewInicio)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Finalización:</span>
                  <span className="text-green-400 font-medium">{formatDate(calcRenewFin(renewInicio, renewDuracion))}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRenewModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenewConfirm}
                disabled={!renewInicio}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificación */}
      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}

// Inline icon components using Lucide-style SVGs
function Users({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function Search({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function Edit2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </svg>
  )
}

function ShieldRenew({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" x2="12" y1="9" y2="15" /><line x1="9" x2="15" y1="12" y2="12" />
    </svg>
  )
}

function Trash2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}
