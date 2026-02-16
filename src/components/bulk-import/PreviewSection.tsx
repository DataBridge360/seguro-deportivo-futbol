'use client'

import { Users, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import type { PreviewResponse } from '@/types/bulk-import'

interface PreviewSectionProps {
  preview: PreviewResponse
  overwriteExisting: boolean
  onOverwriteChange: (value: boolean) => void
  onTestImport: () => void
  onFullImport: () => void
  isLoading: boolean
}

export default function PreviewSection({
  preview,
  overwriteExisting,
  onOverwriteChange,
  onTestImport,
  onFullImport,
  isLoading
}: PreviewSectionProps) {
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const hasErrors = preview.errors.length > 0
  const canImport = preview.new_players.length > 0 || (preview.existing_players.length > 0 && overwriteExisting)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Preview de Importación</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Revisa los datos antes de confirmar la carga
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* New Players */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nuevos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {preview.new_players.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Jugadores a crear
          </p>
        </div>

        {/* Existing Players */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Users className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Existentes</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {preview.existing_players.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ya registrados
          </p>
        </div>

        {/* Errors */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Errores</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {preview.errors.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filas con problemas
          </p>
        </div>
      </div>

      {/* Errors Table */}
      {hasErrors && (
        <div className="bg-white dark:bg-slate-800 border border-red-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-500">Errores de Validación</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Fila</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {preview.errors.map((error, idx) => (
                  <tr key={idx} className="border-b border-slate-200/50 dark:border-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                      {error.row}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {error.dni || '-'}
                    </td>
                    <td className="px-4 py-3 text-red-400">
                      {error.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existing Players Section */}
      {preview.existing_players.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-yellow-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-yellow-500">Jugadores Existentes</h3>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Los siguientes jugadores ya están registrados en el sistema:
          </p>
          <ul className="space-y-2 mb-4">
            {preview.existing_players.slice(0, 5).map((player, idx) => (
              <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                <span className="font-medium">{player.nombre_completo}</span>
                <span className="text-slate-400">({player.dni})</span>
                <span className="text-xs text-slate-400">- Fila {player.row}</span>
              </li>
            ))}
            {preview.existing_players.length > 5 && (
              <li className="text-sm text-slate-400 pl-4">
                ... y {preview.existing_players.length - 5} más
              </li>
            )}
          </ul>

          <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => onOverwriteChange(e.target.checked)}
              className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Sobreescribir datos de jugadores existentes
            </span>
          </label>
        </div>
      )}

      {/* New Players Preview */}
      {preview.new_players.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-green-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-green-500">
              Jugadores Nuevos (mostrando primeros 10)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Fila</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Nombre Completo</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Fecha Nac.</th>
                </tr>
              </thead>
              <tbody>
                {preview.new_players.slice(0, 10).map((player, idx) => (
                  <tr key={idx} className="border-b border-slate-200/50 dark:border-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                      {player.row}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {player.dni}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">
                      {player.nombre_completo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      {formatDate(player.fecha_nacimiento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.new_players.length > 10 && (
            <p className="text-sm text-slate-400 mt-3 text-center">
              ... y {preview.new_players.length - 10} jugadores más
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={onTestImport}
          disabled={isLoading || !canImport}
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {isLoading ? 'Cargando...' : 'Cargar primer jugador de prueba'}
        </button>

        <button
          onClick={onFullImport}
          disabled={isLoading || !canImport}
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? 'Cargando...' : `Cargar todos (${preview.total} jugadores)`}
        </button>
      </div>

      {!canImport && (
        <p className="text-sm text-yellow-500 text-center">
          {hasErrors
            ? 'Corrige los errores en el archivo antes de continuar'
            : 'No hay jugadores para importar'}
        </p>
      )}
    </div>
  )
}
