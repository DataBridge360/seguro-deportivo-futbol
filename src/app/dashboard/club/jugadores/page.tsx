'use client'

import { useState, useEffect, useMemo } from 'react'
import { getJugadores, type JugadorResponse } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

const PAGE_SIZE = 50

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ClubJugadoresPage() {
  const [jugadores, setJugadores] = useState<JugadorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage] = useState(1)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadJugadores()
  }, [])

  const loadJugadores = async () => {
    try {
      setLoading(true)
      const data = await getJugadores()
      setJugadores(data)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar jugadores',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const jugadoresFiltrados = useMemo(() => {
    return jugadores.filter((j) => {
      const search = busqueda.toLowerCase()
      const matchBusqueda =
        !busqueda ||
        j.nombre_completo.toLowerCase().includes(search) ||
        j.dni.includes(search)

      const matchEstado =
        !filtroEstado ||
        (filtroEstado === 'pagado' && j.pagado) ||
        (filtroEstado === 'no_pagado' && !j.pagado)

      return matchBusqueda && matchEstado
    })
  }, [jugadores, busqueda, filtroEstado])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [busqueda, filtroEstado])

  const totalPages = Math.max(1, Math.ceil(jugadoresFiltrados.length / PAGE_SIZE))
  const jugadoresPaginados = jugadoresFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando jugadores...</p>
        </div>
      </div>
    )
  }

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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
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
          {jugadoresFiltrados.length} jugador{jugadoresFiltrados.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Tabla */}
      {jugadores.length === 0 ? (
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
                <th className="px-4 py-3 font-medium">Pagado</th>
              </tr>
            </thead>
            <tbody>
              {jugadoresPaginados.map((jugador) => {
                return (
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
                )
              })}
              {jugadoresFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center"
                  >
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-2">
                      search_off
                    </span>
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                      No se encontraron jugadores
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, jugadoresFiltrados.length)} de {jugadoresFiltrados.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg">first_page</span>
              </button>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
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
