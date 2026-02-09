'use client'

import { MOCK_JUGADORES, MOCK_CUPONES, MOCK_TORNEOS } from '@/lib/mockData'

export default function AdminReportesPage() {
  const totalJugadores = MOCK_JUGADORES.length
  const jugadoresActivos = MOCK_JUGADORES.filter(j => new Date(j.seguroFin) >= new Date()).length
  const jugadoresSinSeguro = totalJugadores - jugadoresActivos
  const totalCupones = MOCK_CUPONES.length
  const cuponesUsados = MOCK_CUPONES.filter(c => c.estado === 'usado').length
  const cuponesDisponibles = MOCK_CUPONES.filter(c => c.estado === 'disponible').length
  const torneosActivos = MOCK_TORNEOS.filter(t => t.estado !== 'Finalizado').length

  const stats = [
    { label: 'Total Jugadores', value: totalJugadores, icon: 'group', color: 'bg-primary/10 text-primary' },
    { label: 'Seguros Activos', value: jugadoresActivos, icon: 'verified_user', color: 'bg-green-500/10 text-green-400' },
    { label: 'Sin Seguro', value: jugadoresSinSeguro, icon: 'warning', color: 'bg-red-500/10 text-red-400' },
    { label: 'Torneos Activos', value: torneosActivos, icon: 'emoji_events', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Total Cupones', value: totalCupones, icon: 'confirmation_number', color: 'bg-indigo-500/10 text-indigo-400' },
    { label: 'Cupones Usados', value: cuponesUsados, icon: 'check_circle', color: 'bg-slate-500/10 text-slate-400' },
    { label: 'Cupones Disponibles', value: cuponesDisponibles, icon: 'redeem', color: 'bg-orange-500/10 text-orange-400' },
    { label: 'Clubs', value: 5, icon: 'domain', color: 'bg-purple-500/10 text-purple-400' },
  ]

  // Jugadores por club
  const jugadoresPorClub = MOCK_JUGADORES.reduce<Record<string, number>>((acc, j) => {
    acc[j.club] = (acc[j.club] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Resumen general del sistema
        </p>
      </div>

      {/* Cards de resumen */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">{stat.label}</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Jugadores por club */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Jugadores por club
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium text-right">Jugadores</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(jugadoresPorClub).map(([club, count]) => (
                <tr key={club} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{club}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
