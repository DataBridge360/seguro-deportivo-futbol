'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import BulkImportWizard from '@/components/bulk-import/BulkImportWizard'
import { getJugadores, type JugadorResponse } from '@/lib/api'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isSeguroVigente(fechaFin: string | null | undefined): boolean {
  if (!fechaFin) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fin = new Date(fechaFin + 'T00:00:00')
  return fin >= today
}

export default function ProductorJugadoresPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [jugadores, setJugadores] = useState<JugadorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'' | 'vigente' | 'vencido'>('')
  const [busqueda, setBusqueda] = useState('')

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLTableCellElement>(null)

  // Modal de eliminación
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; jugador: JugadorResponse | null }>({ open: false, jugador: null })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Modal de renovación
  const [renewModal, setRenewModal] = useState<{ open: boolean; jugador: JugadorResponse | null }>({ open: false, jugador: null })
  const [renewInicio, setRenewInicio] = useState('')
  const [renewDuracion, setRenewDuracion] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('anual')

  // Modal de notificación
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  // Bulk Import Wizard
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Fetch jugadores from API
  const fetchJugadores = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getJugadores()
      setJugadores(data)
    } catch (err: any) {
      setNotification({
        open: true,
        title: 'Error',
        message: err.message || 'Error al cargar jugadores',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJugadores()
  }, [fetchJugadores])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  // Stats
  const stats = useMemo(() => {
    const total = jugadores.length
    const activos = jugadores.filter(j => isSeguroVigente(j.poliza_fin)).length
    const sinSeguro = total - activos
    return { total, activos, sinSeguro }
  }, [jugadores])

  const jugadoresFiltrados = useMemo(() => {
    return jugadores.filter(j => {
      const search = busqueda.toLowerCase()
      const nombreCompleto = `${j.apellido} ${j.nombre}`.toLowerCase()
      const matchBusqueda = !busqueda || nombreCompleto.includes(search) || j.dni.includes(search)
      const vigente = isSeguroVigente(j.poliza_fin)
      const matchEstado = !filtroEstado || (filtroEstado === 'vigente' && vigente) || (filtroEstado === 'vencido' && !vigente)
      return matchBusqueda && matchEstado
    })
  }, [jugadores, filtroEstado, busqueda])

  // Card click filter
  const handleCardClick = (tipo: '' | 'vigente' | 'vencido') => {
    setFiltroEstado(prev => prev === tipo ? '' : tipo)
  }

  // Download Excel (CSV with BOM for Excel UTF-8 compatibility)
  const handleDownloadExcel = () => {
    const BOM = '\uFEFF'
    const headers = ['Nombre', 'DNI', 'Fecha Nacimiento', 'Vigencia Inicio', 'Vigencia Fin', 'Estado']
    const rows = jugadoresFiltrados.map(j => {
      const vigente = isSeguroVigente(j.poliza_fin)
      return [
        `${j.apellido} ${j.nombre}`.toUpperCase(),
        j.dni,
        formatDate(j.fecha_nacimiento),
        j.poliza_inicio ? formatDate(j.poliza_inicio) : '-',
        j.poliza_fin ? formatDate(j.poliza_fin) : '-',
        vigente ? 'Vigente' : 'Vencido'
      ]
    })
    const csvContent = BOM + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jugadores_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Eliminación
  const handleDeleteClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
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
      const nombre = `${deleteModal.jugador.apellido} ${deleteModal.jugador.nombre}`
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
  const handleRenewClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
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
    const nombre = `${jugador.apellido} ${jugador.nombre}`
    const newEndStr = calcRenewFin(renewInicio, renewDuracion)

    setJugadores(prev => prev.map(j =>
      j.id === jugador.id ? { ...j, poliza_inicio: renewInicio, poliza_fin: newEndStr } : j
    ))
    setRenewModal({ open: false, jugador: null })
    setNotification({
      open: true,
      title: 'Seguro renovado',
      message: `El seguro de ${nombre} se renovó desde el ${formatDate(renewInicio)} hasta el ${formatDate(newEndStr)}.`,
      type: 'success'
    })
  }

  const handleEditClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
    router.push(`/dashboard/productor/jugadores/${jugador.id}`)
  }

  return (
    <div className="space-y-8">
      {/* Title + Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jugadores Asegurados</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm sm:text-base">Gestión integral de jugadores y vigencia de pólizas de seguro deportivo.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">download</span>
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">upload_file</span>
            <span className="hidden sm:inline">Carga Masiva</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/productor/jugadores/nuevo')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">person_add</span>
            <span className="hidden sm:inline">Nuevo Jugador</span>
          </button>
        </div>
      </div>

      {/* Summary Cards - Mobile: compact row / Desktop: full cards */}
      {/* Mobile compact stats */}
      <div className="flex gap-2 md:hidden">
        <button
          onClick={() => handleCardClick('')}
          className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === '' ? 'border-primary/50 ring-2 ring-primary/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-lg">person</span>
          </div>
          <div>
            <p className="text-xl font-black leading-none">{stats.total}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
          </div>
        </button>
        <button
          onClick={() => handleCardClick('vigente')}
          className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'vigente' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <span className="material-symbols-outlined text-lg">verified</span>
          </div>
          <div>
            <p className="text-xl font-black leading-none">{stats.activos}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activos</p>
          </div>
        </button>
        <button
          onClick={() => handleCardClick('vencido')}
          className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'vencido' ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <div className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
            <span className="material-symbols-outlined text-lg">warning</span>
          </div>
          <div>
            <p className="text-xl font-black leading-none">{stats.sinSeguro}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Vencido</p>
          </div>
        </button>
      </div>

      {/* Desktop full cards */}
      <div className="hidden md:grid grid-cols-3 gap-6">
        {/* Total */}
        <button
          onClick={() => handleCardClick('')}
          className={`text-left p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === '' ? 'border-primary/50 ring-2 ring-primary/20' : 'border-slate-200 dark:border-white/10 hover:border-primary/30'}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Jugadores</span>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.total}</span>
            <span className="text-xs font-bold text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">trending_flat</span>
            <span>Registrados en el sistema</span>
          </div>
        </button>

        {/* Activos */}
        <button
          onClick={() => handleCardClick('vigente')}
          className={`text-left p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'vigente' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30'}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Activos</span>
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.activos}</span>
            <span className="text-xs font-bold text-slate-400">Vigentes</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">{stats.activos === 0 ? 'info' : 'check_circle'}</span>
            <span>{stats.activos === 0 ? 'Requiere atención inmediata' : 'Coberturas al día'}</span>
          </div>
        </button>

        {/* Sin seguro */}
        <button
          onClick={() => handleCardClick('vencido')}
          className={`text-left p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'vencido' ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-white/10 hover:border-rose-500/30'}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sin seguro</span>
            <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined">warning</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.sinSeguro}</span>
            {stats.total > 0 && (
              <span className="text-xs font-bold text-rose-500">
                {Math.round((stats.sinSeguro / stats.total) * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">priority_high</span>
            <span>Coberturas vencidas</span>
          </div>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative group max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors">search</span>
        <input
          type="text"
          placeholder="Buscar jugador por nombre o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-medium">Cargando jugadores...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto table-scroll">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">DNI</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nacimiento</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vigencia</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Estado</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {jugadoresFiltrados.map((jugador) => {
                    const vigente = isSeguroVigente(jugador.poliza_fin)
                    const nombreCompleto = `${jugador.apellido} ${jugador.nombre}`.toUpperCase()
                    return (
                      <tr key={jugador.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase whitespace-nowrap">{nombreCompleto}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{jugador.dni}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(jugador.fecha_nacimiento)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {jugador.poliza_inicio && jugador.poliza_fin
                            ? `${formatDate(jugador.poliza_inicio)} - ${formatDate(jugador.poliza_fin)}`
                            : '—'
                          }
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter border whitespace-nowrap ${
                            vigente
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          }`}>
                            {vigente ? 'Vigente' : 'Vencido'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative" ref={openMenuId === jugador.id ? menuRef : undefined}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === jugador.id ? null : jugador.id)}
                            className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                          >
                            more_vert
                          </button>
                          {openMenuId === jugador.id && (
                            <div className="absolute right-6 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 z-20 py-1.5 overflow-hidden">
                              <button
                                onClick={() => handleEditClick(jugador)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                                Editar
                              </button>
                              <button
                                onClick={() => handleRenewClick(jugador)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                                Renovar
                              </button>
                              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                              <button
                                onClick={() => handleDeleteClick(jugador)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Borrar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {jugadoresFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">search_off</span>
                        <p className="text-sm font-medium">No se encontraron jugadores</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Mostrando {jugadoresFiltrados.length} de {jugadores.length} jugadores
                {filtroEstado && (
                  <button
                    onClick={() => setFiltroEstado('')}
                    className="ml-2 text-primary hover:underline"
                  >
                    Limpiar filtro
                  </button>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal de Eliminación con Contraseña */}
      {deleteModal.open && deleteModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setDeleteModal({ open: false, jugador: null })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-rose-500/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-rose-500 text-2xl">delete</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-2">Eliminar jugador</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-4">
              ¿Estás seguro de eliminar a <strong className="text-slate-900 dark:text-white">{deleteModal.jugador.apellido} {deleteModal.jugador.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Ingresá tu contraseña para confirmar</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Contraseña"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteConfirm() }}
              />
              {deleteError && (
                <p className="text-rose-500 text-xs mt-1.5 font-medium">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20"
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
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-emerald-500 text-2xl">shield_with_heart</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">Renovar seguro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              <strong className="text-slate-900 dark:text-white">{renewModal.jugador.apellido} {renewModal.jugador.nombre}</strong>
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
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      renewDuracion === opt.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      renewDuracion === opt.value ? 'border-emerald-500' : 'border-slate-400 dark:border-slate-500'
                    }`}>
                      {renewDuracion === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${renewDuracion === opt.value ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {renewInicio && (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 mb-5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Inicio:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{formatDate(renewInicio)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Finalización:</span>
                  <span className="text-emerald-500 font-medium">{formatDate(calcRenewFin(renewInicio, renewDuracion))}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRenewModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenewConfirm}
                disabled={!renewInicio}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
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

      {/* Bulk Import Wizard */}
      <BulkImportWizard
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => {
          fetchJugadores()
        }}
      />
    </div>
  )
}
