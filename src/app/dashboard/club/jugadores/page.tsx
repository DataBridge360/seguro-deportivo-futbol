'use client'

import { useState, useMemo } from 'react'
import { MOCK_JUGADORES, EQUIPOS_NOMBRES, CATEGORIAS, formatDate, isSeguroVigente } from '@/lib/mockData'

export default function ClubJugadoresPage() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEquipo, setFiltroEquipo] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const jugadoresFiltrados = useMemo(() => {
    return MOCK_JUGADORES.filter((j) => {
      const search = busqueda.toLowerCase()
      const matchBusqueda =
        !busqueda ||
        j.nombreCompleto.toLowerCase().includes(search) ||
        j.dni.includes(search)
      const matchEquipo = !filtroEquipo || j.equipo === filtroEquipo
      const matchCategoria = !filtroCategoria || j.categoria === filtroCategoria
      const vigente = isSeguroVigente(j.seguroFin)
      const matchEstado =
        !filtroEstado ||
        (filtroEstado === 'vigente' && vigente) ||
        (filtroEstado === 'sin_seguro' && !vigente)
      return matchBusqueda && matchEquipo && matchCategoria && matchEstado
    })
  }, [busqueda, filtroEquipo, filtroCategoria, filtroEstado])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jugadores</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Listado de jugadores del club (solo lectura)
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filtroEquipo}
          onChange={(e) => setFiltroEquipo(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-w-[160px]"
        >
          <option value="">Todos los equipos</option>
          {EQUIPOS_NOMBRES.map((equipo) => (
            <option key={equipo} value={equipo}>
              {equipo}
            </option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-w-[160px]"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary min-w-[160px]"
        >
          <option value="">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="sin_seguro">Sin seguro</option>
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
              <th className="px-4 py-3 font-medium hidden md:table-cell">Equipo</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Categoría</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">Seguro</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {jugadoresFiltrados.map((jugador) => {
              const vigente = isSeguroVigente(jugador.seguroFin)
              return (
                <tr
                  key={jugador.id}
                  className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {jugador.nombreCompleto}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs md:hidden">
                        {jugador.equipo}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {jugador.dni}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                    {jugador.equipo}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    {jugador.categoria}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    {formatDate(jugador.seguroInicio)} - {formatDate(jugador.seguroFin)}
                  </td>
                  <td className="px-4 py-3">
                    {vigente ? (
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                        Vigente
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-500/10 text-red-400">
                        Sin seguro
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {jugadoresFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-400 dark:text-slate-500"
                >
                  No se encontraron jugadores
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Inline SVG icon
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
