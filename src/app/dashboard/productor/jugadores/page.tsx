'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import BulkImportWizard from '@/components/bulk-import/BulkImportWizard'
import TournamentImportWizard from '@/components/bulk-import/TournamentImportWizard'
import { getJugadoresProductor, getPolizaActiva, createPoliza, uploadPoliza, toggleJugadorPagado, verifyPassword, type JugadorResponse, type PolizaGeneral } from '@/lib/api'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ProductorJugadoresPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [jugadores, setJugadores] = useState<JugadorResponse[]>([])
  const [polizaActiva, setPolizaActiva] = useState<PolizaGeneral | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'' | 'pagado' | 'no_pagado'>('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  // Three-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLTableCellElement>(null)

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

  // Modal de confirmación de pagado=false
  const [unpaidModal, setUnpaidModal] = useState<{ open: boolean; jugador: JugadorResponse | null }>({ open: false, jugador: null })
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

  // Fetch jugadores and poliza from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [jugadoresData, polizaData] = await Promise.all([
        getJugadoresProductor(),
        getPolizaActiva(),
      ])
      setJugadores(jugadoresData)
      setPolizaActiva(polizaData)
    } catch (err: any) {
      setNotification({
        open: true,
        title: 'Error',
        message: err.message || 'Error al cargar datos',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    const pagados = jugadores.filter(j => j.pagado).length
    const noPagados = total - pagados
    return { total, pagados, noPagados }
  }, [jugadores])

  const jugadoresFiltrados = useMemo(() => {
    return jugadores.filter(j => {
      const search = busqueda.toLowerCase()
      const nombreCompleto = `${j.apellido} ${j.nombre}`.toLowerCase()
      const matchBusqueda = !busqueda || nombreCompleto.includes(search) || j.dni.includes(search)
      const matchEstado = !filtroEstado || (filtroEstado === 'pagado' && j.pagado) || (filtroEstado === 'no_pagado' && !j.pagado)
      return matchBusqueda && matchEstado
    })
  }, [jugadores, filtroEstado, busqueda])

  // Reset page when filters/search change
  useEffect(() => { setPage(1) }, [busqueda, filtroEstado])

  const totalPages = Math.max(1, Math.ceil(jugadoresFiltrados.length / PAGE_SIZE))
  const jugadoresPaginados = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return jugadoresFiltrados.slice(start, start + PAGE_SIZE)
  }, [jugadoresFiltrados, page])

  // Card click filter
  const handleCardClick = (tipo: '' | 'pagado' | 'no_pagado') => {
    setFiltroEstado(prev => prev === tipo ? '' : tipo)
  }

  // Download Excel (CSV with BOM for Excel UTF-8 compatibility)
  const handleDownloadExcel = () => {
    const BOM = '\uFEFF'
    const headers = ['Nombre', 'DNI', 'Fecha Nacimiento', 'Pagado', 'Estado']
    const rows = jugadoresFiltrados.map(j => {
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

  // Toggle pagado
  const handleTogglePagado = async (jugador: JugadorResponse) => {
    if (!jugador.pagado) {
      // Marcar como pagado: directo, sin contraseña
      try {
        setTogglingPagado(jugador.id)
        await toggleJugadorPagado(jugador.id, true)
        setJugadores(prev => prev.map(j => j.id === jugador.id ? { ...j, pagado: true } : j))
      } catch (err: any) {
        setNotification({ open: true, title: 'Error', message: err.message || 'Error al actualizar estado', type: 'error' })
      } finally {
        setTogglingPagado(null)
      }
    } else {
      // Marcar como no pagado: pedir contraseña
      setUnpaidModal({ open: true, jugador })
      setUnpaidPassword('')
      setUnpaidError('')
    }
  }

  const handleUnpaidConfirm = async () => {
    if (!unpaidModal.jugador) return
    if (!unpaidPassword) {
      setUnpaidError('Ingresa tu contraseña')
      return
    }
    try {
      setTogglingPagado(unpaidModal.jugador.id)
      // Verificar contraseña
      await verifyPassword(unpaidPassword)
      // Si el login fue exitoso, cambiar el estado
      await toggleJugadorPagado(unpaidModal.jugador.id, false)
      setJugadores(prev => prev.map(j => j.id === unpaidModal.jugador!.id ? { ...j, pagado: false } : j))
      setUnpaidModal({ open: false, jugador: null })
    } catch (err: any) {
      if (err.message?.includes('Contraseña') || err.message?.includes('contraseña') || err.message?.includes('Credenciales') || err.message?.includes('credenciales') || err.message?.includes('Unauthorized')) {
        setUnpaidError('Contraseña incorrecta')
      } else {
        setNotification({ open: true, title: 'Error', message: err.message || 'Error al actualizar estado', type: 'error' })
        setUnpaidModal({ open: false, jugador: null })
      }
    } finally {
      setTogglingPagado(null)
    }
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

  const handleEditClick = (jugador: JugadorResponse) => {
    setOpenMenuId(null)
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

      // Si hay archivo, subirlo
      if (polizaFile && newPoliza.id) {
        await uploadPoliza(newPoliza.id, polizaFile)
      }

      // Recargar datos (pagado se reseteo para todos)
      await fetchData()
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
      {/* Mobile compact stats */}
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
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Pagado</th>
                    <th className="px-6 py-4 sm:py-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {jugadoresPaginados.map((jugador) => {
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
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">search_off</span>
                        <p className="text-sm font-medium">No se encontraron jugadores</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                {jugadoresFiltrados.length > PAGE_SIZE
                  ? `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, jugadoresFiltrados.length)} de ${jugadoresFiltrados.length}`
                  : `${jugadoresFiltrados.length} jugadores`}
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
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_left</span>
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[4rem] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-300">chevron_right</span>
                  </button>
                </div>
              )}
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

      {/* Modal de Confirmación para marcar como No Pagado */}
      {unpaidModal.open && unpaidModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setUnpaidModal({ open: false, jugador: null })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-amber-500/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-2">Marcar como no pagado</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-4">
              Vas a cambiar el estado de <strong className="text-slate-900 dark:text-white">{unpaidModal.jugador.apellido} {unpaidModal.jugador.nombre}</strong> a no pagado. Confirmá con tu contraseña.
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
                onClick={() => setUnpaidModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleUnpaidConfirm}
                disabled={togglingPagado !== null}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
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

            {/* Fecha inicio */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de inicio</label>
              <DatePicker
                value={polizaInicio}
                onChange={setPolizaInicio}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Fecha fin */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de finalización</label>
              <DatePicker
                value={polizaFin}
                onChange={setPolizaFin}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Observaciones */}
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

            {/* Upload PDF */}
            <div className="mb-5">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Archivo PDF (opcional)</label>
              <label className="flex items-center gap-3 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-lg">upload_file</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
                  {polizaFile ? polizaFile.name : 'Seleccionar archivo PDF'}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setPolizaFile(e.target.files?.[0] || null)}
                />
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

      {/* Bulk Import Wizard */}
      <BulkImportWizard
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => {
          fetchData()
        }}
      />

      {/* Tournament Import Wizard */}
      <TournamentImportWizard
        isOpen={showTournamentImport}
        onClose={() => setShowTournamentImport(false)}
        onImportComplete={() => {
          fetchData()
        }}
      />
    </div>
  )
}
