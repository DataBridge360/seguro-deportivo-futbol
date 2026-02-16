'use client'

import { CheckCircle, AlertCircle, Upload, Users, Key } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ImportResult } from '@/types/bulk-import'
import { generatePassword } from '@/lib/password-generator'

interface ResultsSectionProps {
  result: ImportResult
  onNewImport: () => void
}

export default function ResultsSection({ result, onNewImport }: ResultsSectionProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resultado de Importación</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Resumen de la carga masiva de jugadores
        </p>
      </div>

      {/* Success/Error Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-lg ${
        result.success
          ? 'bg-green-500/10 border border-green-500/20'
          : 'bg-red-500/10 border border-red-500/20'
      }`}>
        {result.success ? (
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        )}
        <div>
          <h3 className={`font-semibold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
            {result.success ? 'Importación Exitosa' : 'Importación con Errores'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {result.message}
          </p>
        </div>
      </div>

      {/* Created Players Table with Passwords - Show if players were inserted */}
      {(result.inserted > 0) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                ✅ {result.inserted === 1 ? 'Jugador Creado' : `${result.inserted} Jugadores Creados`}
              </h3>
              <p className="text-sm text-green-600 dark:text-green-300">
                Se {result.inserted === 1 ? 'ha generado' : 'han generado'} contraseñas automáticamente. Los jugadores deben cambiarlas en el primer inicio de sesión.
              </p>
            </div>
          </div>

          {/* If backend provides created_players array with data, show table */}
          {result.created_players && result.created_players.length > 0 ? (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700 overflow-hidden">
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100 dark:bg-green-900/50 sticky top-0">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-semibold text-green-800 dark:text-green-300">Nombre Completo</th>
                        <th className="px-4 py-3 font-semibold text-green-800 dark:text-green-300">DNI</th>
                        <th className="px-4 py-3 font-semibold text-green-800 dark:text-green-300">Contraseña</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.created_players.map((player, idx) => {
                        const password = generatePassword(player.apellido, player.dni)

                        return (
                          <tr key={idx} className="border-b border-green-100 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/10">
                            <td className="px-4 py-3 text-slate-900 dark:text-white">{player.nombre_completo}</td>
                            <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{player.dni}</td>
                            <td className="px-4 py-3">
                              <code className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1.5 rounded font-mono font-bold">
                                {password}
                              </code>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* If backend doesn't provide created_players, show generic message */
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-700 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                Se {result.inserted === 1 ? 'creó' : 'crearon'} exitosamente {result.inserted === 1 ? 'el jugador' : `${result.inserted} jugadores`}.
                {result.inserted === 1 ? ' El jugador puede' : ' Los jugadores pueden'} iniciar sesión con su DNI y contraseña generada.
              </p>
            </div>
          )}

          {/* Password Format Explanation */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  📋 Formato de Contraseña Automática
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                  Las contraseñas se generan con el siguiente formato:
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 mb-3">
                  <code className="text-sm">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">Apellido</span>
                    <span className="text-slate-500"> (primera letra mayúscula)</span>
                    {' + '}
                    <span className="text-blue-600 dark:text-blue-400 font-bold">últimos 3 dígitos del DNI</span>
                  </code>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Ejemplo:</p>
                  <p className="text-sm font-mono">
                    <span className="text-slate-600 dark:text-slate-400">DNI:</span> <span className="font-bold">28387875</span>
                    {' → '}
                    <span className="text-slate-600 dark:text-slate-400">Apellido:</span> <span className="font-bold">ABARZUA</span>
                    {' → '}
                    <span className="text-slate-600 dark:text-slate-400">Contraseña:</span>{' '}
                    <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-bold">
                      Abarzua875
                    </code>
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Los jugadores deben cambiar su contraseña en el primer inicio de sesión por seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Updated Players - Only show if players were updated */}
      {result.updated_players && result.updated_players.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                🔄 Jugadores Actualizados ({result.updated_players.length})
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                Los siguientes jugadores fueron actualizados con nueva información.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
            <ul className="space-y-1.5 max-h-40 overflow-y-auto">
              {result.updated_players.map((player, idx) => (
                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="font-medium">{player.nombre_completo}</span>
                  <span className="text-slate-400">({player.dni})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Inserted */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Insertados</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {result.inserted}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Jugadores nuevos
          </p>
        </div>

        {/* Updated */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Actualizados</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {result.updated}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Jugadores modificados
          </p>
        </div>

        {/* Skipped */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-slate-500/10">
              <AlertCircle className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Omitidos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {result.skipped}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No procesados
          </p>
        </div>
      </div>

      {/* Summary Details */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Detalles de la Importación
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Perfiles creados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {result.summary.perfiles_created}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Jugadores creados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {result.summary.jugadores_created}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 mb-1">Relaciones club creadas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {result.summary.jugador_club_created}
            </p>
          </div>
        </div>
      </div>

      {/* Errors List */}
      {result.errors.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-red-500/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-500">
              Errores durante la Importación
            </h3>
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
                {result.errors.map((error, idx) => (
                  <tr key={idx} className="border-b border-slate-200/50 dark:border-slate-700/50">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                      {error.row}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {error.dni}
                    </td>
                    <td className="px-4 py-3 text-red-400">
                      {error.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={onNewImport}
          className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Upload className="w-4 h-4" />
          Nueva Carga
        </button>

        <button
          onClick={() => router.push('/dashboard/productor/jugadores')}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Users className="w-4 h-4" />
          Ver Jugadores
        </button>
      </div>
    </div>
  )
}
