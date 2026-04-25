'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import BulkImportWizard from '@/components/bulk-import/BulkImportWizard'
import TournamentImportWizard from '@/components/bulk-import/TournamentImportWizard'
import { getJugadoresProductor, getEquipos, getPolizaActiva, createPoliza, uploadPoliza, toggleJugadorPagado, deleteJugador, verifyPassword, type JugadorResponse, type PolizaGeneral } from '@/lib/api'
import { type Equipo } from '@/types/club'

const PAGE_SIZE = 50

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ProductorJugadoresPage() {
  const router = useRouter()
  useAuthStore()

  const [jugadores, setJugadores] = useState<JugadorResponse[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [polizaActiva, setPolizaActiva] = useState<PolizaGeneral | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'' | 'pagado' | 'no_pagado'>('')
  const [filtroEquipos, setFiltroEquipos] = useState<string[]>([])
  const [equipoDropdownOpen, setEquipoDropdownOpen] = useState(false)
  const equipoDropdownRef = useRef<HTMLDivElement>(null)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({ total: 0, pagados: 0, noPagados: 0 })

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Modal de eliminación
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; jugador: JugadorResponse | null }>({ open: false, jugador: null })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Modal de nueva póliza
  const [polizaModal, setPolizaModal] = useState(false)
  const [polizaInicio, setPolizaInicio] = useState('')
  const [polizaFin, setPolizaFin] = useState('')
  const [polizaObservaciones, setPolizaObservaciones] = useState('')
  const [polizaFile, setPolizaFile] = useState<File | null>(null)
  const [polizaCreating, setPolizaCreating] = useState(false)

  // Modal de confirmación de cambio de pagado (ambas direcciones)
  const [unpaidModal, setUnpaidModal] = useState<{ open: boolean; jugador: JugadorResponse | null; targetPagado: boolean }>({ open: false, jugador: null, targetPagado: false })
  const [unpaidPassword, setUnpaidPassword] = useState('')
  const [unpaidError, setUnpaidError] = useState('')

  // Toggle pagado loading
  const [togglingPagado, setTogglingPagado] = useState<string | null>(null)

  // Modal de notificación
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  // Bulk Import
  const [showImportSelector, setShowImportSelector] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showTournamentImport, setShowTournamentImport] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setPage(1)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [busqueda])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [filtroEstado, filtroEquipos])

  // Fetch jugadores paginated
  const fetchJugadores = useCallback(async (currentPage: number, search: string, estado: string, equipoIdsFiltro: string[]) => {
    try {
      setLoading(true)
      const params: Parameters<typeof getJugadoresProductor>[0] = {
        page: currentPage,
        limit: PAGE_SIZE,
      }
      if (search) params.search = search
      if (estado === 'pagado') params.pagado = true
      if (estado === 'no_pagado') params.pagado = false
      if (equipoIdsFiltro.length > 0) params.equipoIds = equipoIdsFiltro

      const res = await getJugadoresProductor(params)
      setJugadores(res.data)
      setTotal(res.total)
      setTotalPages(res.totalPages)
      setStats(res.stats)
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

  // Fetch poliza once on mount
  const fetchPoliza = useCallback(async () => {
    try {
      const polizaData = await getPolizaActiva()
      setPolizaActiva(polizaData)
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => {
    fetchPoliza()
  }, [fetchPoliza])

  // Load equipos on mount
  useEffect(() => {
    getEquipos().then(setEquipos).catch(() => {})
  }, [])

  useEffect(() => {
    fetchJugadores(page, busquedaDebounced, filtroEstado, filtroEquipos)
  }, [page, busquedaDebounced, filtroEstado, filtroEquipos, fetchJugadores])

  // Close equipo dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (equipoDropdownRef.current && !equipoDropdownRef.current.contains(e.target as Node)) {
        setEquipoDropdownOpen(false)
      }
    }
    if (equipoDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [equipoDropdownOpen])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
        setMenuPos(null)
      }
    }
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  // Card click filter
  const handleCardClick = (tipo: '' | 'pagado' | 'no_pagado') => {
    setFiltroEstado(prev => prev === tipo ? '' : tipo)
  }

  // Download Excel (CSV with BOM for Excel UTF-8 compatibility)
  const handleDownloadExcel = () => {
    const BOM = '\uFEFF'
    const headers = ['Nombre', 'DNI', 'Fecha Nacimiento', 'Pagado', 'Estado']
    const rows = jugadores.map(j => {
      return [
        `${j.apellido} ${j.nombre}`.toUpperCase(),
        j.dni,
        formatDate(j.fecha_nacimiento),
        j.pagado ? 'Sí' : 'No',
        j.pagado ? 'Pagado' : 'No Pagado'
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

  // Toggle pagado — siempre pide contraseña
  const handleTogglePagado = (jugador: JugadorResponse) => {
    setUnpaidModal({ open: true, jugador, targetPagado: !jugador.pagado })
    setUnpaidPassword('')
    setUnpaidError('')
  }

  const handleUnpaidConfirm = async () => {
    if (!unpaidModal.jugador) return
    if (!unpaidPassword) {
      setUnpaidError('Ingresa tu contraseña')
      return
    }
    const { jugador, targetPagado } = unpaidModal
    try {
      setTogglingPagado(jugador.id)
      await verifyPassword(unpaidPassword)
      await toggleJugadorPagado(jugador.id, targetPagado)
      setJugadores(prev => prev.map(j => j.id === jugador.id ? { ...j, pagado: targetPagado } : j))
      setStats(prev => ({
        ...prev,
        pagados: prev.pagados + (targetPagado ? 1 : -1),
        noPagados: prev.noPagados + (targetPagado ? -1 : 1),
      }))
      setUnpaidModal({ open: false, jugador: null, targetPagado: false })
    } catch (err: any) {
      if (err.message?.includes('Contraseña') || err.message?.includes('contraseña') || err.message?.includes('Credenciales') || err.message?.includes('credenciales') || err.message?.includes('Unauthorized')) {
        setUnpaidError('Contraseña incorrecta')
      } else {
        setNotification({ open: true, title: 'Error', message: err.message || 'Error al actualizar estado', type: 'error' })
        setUnpaidModal({ open: false, jugador: null, targetPagado: false })
      }
    } finally {
      setTogglingPagado(null)
    }
  }

  // Eliminación
  const handleDeleteClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
    setMenuPos(null)
    setDeleteModal({ open: true, jugador })
    setDeletePassword('')
    setDeleteError('')
  }

  const [deletingJugador, setDeletingJugador] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteModal.jugador) return
    if (!deletePassword) {
      setDeleteError('Ingresá tu contraseña')
      return
    }
    try {
      setDeletingJugador(true)
      await verifyPassword(deletePassword)
      await deleteJugador(deleteModal.jugador.id)
      const nombre = `${deleteModal.jugador.apellido} ${deleteModal.jugador.nombre}`
      setJugadores(prev => prev.filter(j => j.id !== deleteModal.jugador!.id))
      setStats(prev => ({
        total: prev.total - 1,
        pagados: deleteModal.jugador!.pagado ? prev.pagados - 1 : prev.pagados,
        noPagados: deleteModal.jugador!.pagado ? prev.noPagados : prev.noPagados - 1,
      }))
      setTotal(prev => prev - 1)
      setDeleteModal({ open: false, jugador: null })
      setNotification({
        open: true,
        title: 'Jugador eliminado',
        message: `${nombre} fue eliminado correctamente.`,
        type: 'success'
      })
    } catch (err: any) {
      if (err.message?.includes('Contraseña') || err.message?.includes('contraseña') || err.message?.includes('Credenciales') || err.message?.includes('credenciales') || err.message?.includes('Unauthorized')) {
        setDeleteError('Contraseña incorrecta')
      } else {
        setNotification({ open: true, title: 'Error', message: err.message || 'Error al eliminar jugador', type: 'error' })
        setDeleteModal({ open: false, jugador: null })
      }
    } finally {
      setDeletingJugador(false)
    }
  }

  const handleEditClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
    setMenuPos(null)
    router.push(`/dashboard/productor/jugadores/${jugador.id}`)
  }

  // Crear nueva póliza
  const handleCreatePoliza = async () => {
    if (!polizaInicio || !polizaFin) return
    try {
      setPolizaCreating(true)
      const newPoliza = await createPoliza({
        fecha_inicio: polizaInicio,
        fecha_fin: polizaFin,
        observaciones: polizaObservaciones || undefined,
      })

      if (polizaFile && newPoliza.id) {
        await uploadPoliza(newPoliza.id, polizaFile)
      }

      await fetchPoliza()
      await fetchJugadores(1, busquedaDebounced, filtroEstado, filtroEquipos)
      setPage(1)
      setPolizaModal(false)
      setPolizaInicio('')
      setPolizaFin('')
      setPolizaObservaciones('')
      setPolizaFile(null)
      setNotification({
        open: true,
        title: 'Póliza creada',
        message: 'Se creó la nueva póliza y se resetearon todos los estados de pago.',
        type: 'success'
      })
    } catch (err: any) {
      setNotification({ open: true, title: 'Error', message: err.message || 'Error al crear póliza', type: 'error' })
    } finally {
      setPolizaCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Title + Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Jugadores Asegurados</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm sm:text-base">Gestión integral de jugadores y estado de pago del seguro deportivo.</p>
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
            onClick={() => setShowImportSelector(true)}
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

      {/* Póliza General Card */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Póliza General Vigente</h3>
              {polizaActiva ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDate(polizaActiva.fecha_inicio)} - {formatDate(polizaActiva.fecha_fin)}
                  {polizaActiva.observaciones && <span className="ml-2 text-xs text-slate-400">({polizaActiva.observaciones})</span>}
                </p>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">No hay póliza activa</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {polizaActiva?.archivo_url && (
              <a
                href={polizaActiva.archivo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                Ver PDF
              </a>
            )}
            <button
              onClick={() => setPolizaModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-base sm:text-lg">add_circle</span>
              Nueva Póliza
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Mobile: compact row / Desktop: full cards */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <button
          onClick={() => handleCardClick('')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === '' ? 'border-primary/50 ring-2 ring-primary/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <p className="text-lg font-black leading-none text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total</p>
        </button>
        <button
          onClick={() => handleCardClick('pagado')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'pagado' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <p className="text-lg font-black leading-none text-emerald-500">{stats.pagados}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Pagados</p>
        </button>
        <button
          onClick={() => handleCardClick('no_pagado')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'no_pagado' ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-white/10'}`}
        >
          <p className="text-lg font-black leading-none text-rose-500">{stats.noPagados}</p>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-0.5">No pagado</p>
        </button>
      </div>

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

        {/* Pagados */}
        <button
          onClick={() => handleCardClick('pagado')}
          className={`text-left p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'pagado' ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-white/10 hover:border-emerald-500/30'}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Pagados</span>
            <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.pagados}</span>
            <span className="text-xs font-bold text-slate-400">Pagos al día</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">{stats.pagados === 0 ? 'info' : 'check_circle'}</span>
            <span>{stats.pagados === 0 ? 'Requiere atención' : 'Coberturas al día'}</span>
          </div>
        </button>

        {/* No pagados */}
        <button
          onClick={() => handleCardClick('no_pagado')}
          className={`text-left p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group transition-all
            bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border
            ${filtroEstado === 'no_pagado' ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-white/10 hover:border-rose-500/30'}`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">No Pagados</span>
            <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <span className="material-symbols-outlined">cancel</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{stats.noPagados}</span>
            {stats.total > 0 && (
              <span className="text-xs font-bold text-rose-500">
                {Math.round((stats.noPagados / stats.total) * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-rose-500 text-xs font-medium">
            <span className="material-symbols-outlined text-sm">priority_high</span>
            <span>Pendientes de pago</span>
          </div>
        </button>
      </div>

      {/* Search bar + Equipo filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group max-w-md flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors">search</span>
          <input
            type="text"
            placeholder="Buscar jugador por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Equipo multi-select dropdown */}
        <div className="relative shrink-0" ref={equipoDropdownRef}>
          <button
            onClick={() => setEquipoDropdownOpen(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all
              ${filtroEquipos.length > 0
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Equipo{filtroEquipos.length > 0 ? ` (${filtroEquipos.length})` : ''}</span>
            <span className="material-symbols-outlined text-[16px] ml-0.5">{equipoDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}</span>
          </button>

          {equipoDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 z-50 py-1.5 overflow-hidden">
              {equipos.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">No hay equipos disponibles</p>
              ) : (
                <>
                  {filtroEquipos.length > 0 && (
                    <button
                      onClick={() => { setFiltroEquipos([]); setEquipoDropdownOpen(false) }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Limpiar filtro
                    </button>
                  )}
                  <div className="max-h-56 overflow-y-auto">
                    {equipos.map(eq => {
                      const checked = filtroEquipos.includes(eq.id)
                      return (
                        <button
                          key={eq.id}
                          onClick={() => {
                            setFiltroEquipos(prev =>
                              checked ? prev.filter(id => id !== eq.id) : [...prev, eq.id]
                            )
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked
                              ? 'bg-primary border-primary'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {checked && <span className="material-symbols-outlined text-white text-[11px] leading-none">check</span>}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {eq.nombre}
                            {eq.categorias && eq.categorias.length > 0 && (
                              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">· {eq.categorias.map(c => c.nombre).join(', ')}</span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/20">
        <div className="overflow-x-auto table-scroll">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nombre</th>
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">DNI</th>
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nacimiento</th>
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden xl:table-cell">Equipos</th>
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Pagado</th>
                <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-40" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>
                    <td className="px-6 py-4 hidden xl:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" /></td>
                    <td className="px-6 py-4"><div className="h-5 w-11 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mx-auto" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-4 ml-auto" /></td>
                  </tr>
                ))
              ) : jugadores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">search_off</span>
                    <p className="text-sm font-medium">No se encontraron jugadores</p>
                  </td>
                </tr>
              ) : jugadores.map((jugador) => {
                const nombreCompleto = `${jugador.apellido} ${jugador.nombre}`.toUpperCase()
                const isToggling = togglingPagado === jugador.id
                return (
                  <tr key={jugador.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase whitespace-nowrap">{nombreCompleto}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">{jugador.dni}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(jugador.fecha_nacimiento)}
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      {jugador.equipos_torneo && jugador.equipos_torneo.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {jugador.equipos_torneo.map((eq, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {eq.equipo_nombre}
                              {eq.categoria_nombre && (
                                <span className="text-primary/60">· {eq.categoria_nombre}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleTogglePagado(jugador)}
                        disabled={isToggling}
                        className="inline-flex items-center justify-center"
                      >
                        {isToggling ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                            jugador.pagado ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}>
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                              jugador.pagado ? 'translate-x-[22px]' : 'translate-x-0.5'
                            }`} />
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          if (openMenuId === jugador.id) {
                            setOpenMenuId(null)
                            setMenuPos(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                            setOpenMenuId(jugador.id)
                          }
                        }}
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors"
                      >
                        more_vert
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            {total > PAGE_SIZE
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`
              : `${total} jugadores`}
            {filtroEstado && (
              <button onClick={() => setFiltroEstado('')} className="ml-2 text-primary hover:underline">
                Limpiar filtro
              </button>
            )}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_left</span>
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_right</span>
              </button>
            </div>
          )}
        </div>
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
                disabled={deletingJugador}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20"
              >
                {deletingJugador ? 'Verificando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para cambiar estado de pago */}
      {unpaidModal.open && unpaidModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setUnpaidModal({ open: false, jugador: null, targetPagado: false })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className={`${unpaidModal.targetPagado ? 'bg-emerald-500/10' : 'bg-amber-500/10'} p-3 rounded-full`}>
                <span className={`material-symbols-outlined text-2xl ${unpaidModal.targetPagado ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {unpaidModal.targetPagado ? 'check_circle' : 'warning'}
                </span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-2">
              {unpaidModal.targetPagado ? 'Marcar como pagado' : 'Marcar como no pagado'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-4">
              Vas a cambiar el estado de <strong className="text-slate-900 dark:text-white">{unpaidModal.jugador.apellido} {unpaidModal.jugador.nombre}</strong> a <strong>{unpaidModal.targetPagado ? 'pagado' : 'no pagado'}</strong>. Confirmá con tu contraseña.
            </p>
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Tu contraseña</label>
              <input
                type="password"
                value={unpaidPassword}
                onChange={(e) => { setUnpaidPassword(e.target.value); setUnpaidError('') }}
                placeholder="Contraseña"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleUnpaidConfirm() }}
              />
              {unpaidError && (
                <p className="text-rose-500 text-xs mt-1.5 font-medium">{unpaidError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUnpaidModal({ open: false, jugador: null, targetPagado: false })}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnpaidConfirm}
                disabled={togglingPagado !== null}
                className={`flex-1 px-4 py-2.5 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all ${unpaidModal.targetPagado ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20'}`}
              >
                {togglingPagado ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Póliza */}
      {polizaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !polizaCreating && setPolizaModal(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-primary text-2xl">shield</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">Nueva Póliza General</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              Al crear una nueva póliza, <strong className="text-rose-500">todos los jugadores se resetearán a no pagado</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de inicio</label>
              <DatePicker value={polizaInicio} onChange={setPolizaInicio} placeholder="Seleccionar fecha" />
            </div>

            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de finalización</label>
              <DatePicker value={polizaFin} onChange={setPolizaFin} placeholder="Seleccionar fecha" />
            </div>

            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Observaciones (opcional)</label>
              <input
                type="text"
                value={polizaObservaciones}
                onChange={(e) => setPolizaObservaciones(e.target.value)}
                placeholder="Ej: Período 2026-2027"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="mb-5">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Archivo PDF (opcional)</label>
              <label className="flex items-center gap-3 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">upload_file</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
                  {polizaFile ? polizaFile.name : 'Seleccionar archivo PDF'}
                </span>
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setPolizaFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPolizaModal(false)}
                disabled={polizaCreating}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePoliza}
                disabled={!polizaInicio || !polizaFin || polizaCreating}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
              >
                {polizaCreating ? 'Creando...' : 'Crear Póliza'}
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

      {/* Import Selector Modal */}
      {showImportSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowImportSelector(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-primary text-2xl">upload_file</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">Carga Masiva</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              Seleccioná el tipo de importación que querés realizar
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowImportSelector(false); setShowBulkImport(true) }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/5 transition-all group"
              >
                <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-500/20 transition-colors">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Carga Masiva de Jugadores</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Importar jugadores desde Excel (DNI, nombre, apellido, fecha nac.)</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              </button>
              <button
                onClick={() => { setShowImportSelector(false); setShowTournamentImport(true) }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/5 transition-all group"
              >
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 group-hover:bg-purple-500/20 transition-colors">
                  <span className="material-symbols-outlined">emoji_events</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Carga Masiva de Torneo</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Crear torneo completo: categorías, equipos y jugadores desde Excel</p>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              </button>
            </div>
            <button
              onClick={() => setShowImportSelector(false)}
              className="w-full mt-4 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all text-slate-500 dark:text-slate-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Three-dot dropdown fixed portal */}
      {openMenuId && menuPos && (() => {
        const jugador = jugadores.find(j => j.id === openMenuId)
        if (!jugador) return null
        return (
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            className="w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/30 z-[9999] py-1.5 overflow-hidden"
          >
            <button
              onClick={() => handleEditClick(jugador)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Editar
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
        )
      })()}

      {/* Bulk Import Wizard */}
      <BulkImportWizard
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => { fetchJugadores(1, busquedaDebounced, filtroEstado, filtroEquipos); setPage(1) }}
      />

      {/* Tournament Import Wizard */}
      <TournamentImportWizard
        isOpen={showTournamentImport}
        onClose={() => setShowTournamentImport(false)}
        onImportComplete={() => { fetchJugadores(1, busquedaDebounced, filtroEstado, filtroEquipos); setPage(1) }}
      />
    </div>
  )
}
