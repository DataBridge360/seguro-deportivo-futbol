'use client'

import { useState, useEffect, useRef } from 'react'
import { getJugadores, getEquipos, type JugadorResponse } from '@/lib/api'
import { type Equipo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

const PAGE_SIZE = 50

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ClubJugadoresPage() {
  const [jugadores, setJugadores] = useState<JugadorResponse[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEquipos, setFiltroEquipos] = useState<string[]>([])
  const [equipoDropdownOpen, setEquipoDropdownOpen] = useState(false)
  const equipoDropdownRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar equipos al montar
  useEffect(() => {
    getEquipos().then(setEquipos).catch(() => {})
  }, [])

  // Cerrar dropdown al clickear afuera
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

  // Fetch data whenever page / search / filter changes
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        const params: Parameters<typeof getJugadores>[0] = {
          page,
          limit: PAGE_SIZE,
        }
        if (busquedaDebounced) params.search = busquedaDebounced
        if (filtroEstado === 'pagado') params.pagado = true
        if (filtroEstado === 'no_pagado') params.pagado = false
        if (filtroEquipos.length > 0) params.equipoIds = filtroEquipos

        const res = await getJugadores(params)
        if (cancelled) return
        setJugadores(res.data)
        setTotal(res.total)
        setTotalPages(res.totalPages)
      } catch (error) {
        if (cancelled) return
        setNotification({
          open: true,
          title: 'Error al cargar jugadores',
          message: error instanceof Error ? error.message : 'Error desconocido',
          type: 'error'
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [page, busquedaDebounced, filtroEstado, filtroEquipos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jugadores</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Listado de jugadores del club
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filtro equipo multi-select */}
        <div className="relative" ref={equipoDropdownRef}>
          <button
            onClick={() => setEquipoDropdownOpen(o => !o)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-colors min-w-[170px] w-full sm:w-auto
              ${filtroEquipos.length > 0
                ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-lg">shield</span>
            <span className="flex-1 text-left">
              {filtroEquipos.length === 0 ? 'Todos los equipos' : `${filtroEquipos.length} equipo${filtroEquipos.length > 1 ? 's' : ''}`}
            </span>
            <span className="material-symbols-outlined text-base">{equipoDropdownOpen ? 'expand_less' : 'expand_more'}</span>
          </button>
          {equipoDropdownOpen && (
            <div className="absolute z-30 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto py-1">
                {equipos.filter(e => e.activo).map(eq => (
                  <label key={eq.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filtroEquipos.includes(eq.id)}
                      onChange={() => {
                        setFiltroEquipos(prev =>
                          prev.includes(eq.id) ? prev.filter(id => id !== eq.id) : [...prev, eq.id]
                        )
                      }}
                      className="accent-primary w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{eq.nombre}</span>
                  </label>
                ))}
                {equipos.filter(e => e.activo).length === 0 && (
                  <p className="px-4 py-3 text-sm text-slate-400">No hay equipos</p>
                )}
              </div>
              {filtroEquipos.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                  <button
                    onClick={() => { setFiltroEquipos([]); setEquipoDropdownOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">filter_alt_off</span>
                    Limpiar filtro
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary min-w-[180px]"
        >
          <option value="">Todos los estados</option>
          <option value="pagado">Seguro pagado</option>
          <option value="no_pagado">Seguro no pagado</option>
        </select>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-slate-400 text-xl">group</span>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {loading ? '...' : `${total} jugador${total !== 1 ? 'es' : ''}`}
        </p>
      </div>

      {/* Tabla */}
      {!loading && jugadores.length === 0 && !busquedaDebounced && !filtroEstado ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">person_off</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay jugadores registrados</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Nacimiento</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Equipos</th>
                  <th className="px-4 py-3 font-medium">Pagado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-40" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20" /></td>
                      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24" /></td>
                      <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32" /></td>
                      <td className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-16" /></td>
                    </tr>
                  ))
                ) : jugadores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-2">search_off</span>
                      <p className="text-slate-400 dark:text-slate-500 text-sm">No se encontraron jugadores</p>
                    </td>
                  </tr>
                ) : jugadores.map((jugador) => (
                  <tr
                    key={jugador.id}
                    className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {jugador.nombre_completo}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs md:hidden">
                          {formatDate(jugador.fecha_nacimiento)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                      {jugador.dni}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {formatDate(jugador.fecha_nacimiento)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
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
                    <td className="px-4 py-3">
                      {jugador.pagado ? (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                          Pagado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400">
                          No pagado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">first_page</span>
                </button>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1 || loading}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages || loading}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages || loading}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">last_page</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
