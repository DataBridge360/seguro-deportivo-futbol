'use client'

const canjesDelDia = [
  { id: '1', hora: '09:15', codigo: 'CUP-2026-A1B2', jugador: 'Martín López', montoCompra: 1500, descuento: 225, tipo: '15%' },
  { id: '2', hora: '10:30', codigo: 'CUP-2026-C3D4', jugador: 'Luciano Pérez', montoCompra: 800, descuento: 500, tipo: '$500' },
  { id: '3', hora: '12:45', codigo: 'CUP-2026-K1L2', jugador: 'Nicolás Fernández', montoCompra: 2200, descuento: 440, tipo: '20%' },
  { id: '4', hora: '14:20', codigo: 'CUP-2026-I9J0', jugador: 'Tomás Rodríguez', montoCompra: 950, descuento: 190, tipo: '20%' },
  { id: '5', hora: '16:00', codigo: 'CUP-2026-E5F6', jugador: 'Facundo García', montoCompra: 1200, descuento: 120, tipo: '10%' },
]

export default function CantinaCierrePage() {
  const totalCanjes = canjesDelDia.length
  const totalDescuentos = canjesDelDia.reduce((acc, c) => acc + c.descuento, 0)
  const totalVentas = canjesDelDia.reduce((acc, c) => acc + c.montoCompra, 0)
  const totalCobrado = totalVentas - totalDescuentos

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cierre de Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Resumen de canjes del dia - {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cards resumen */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">confirmation_number</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Canjes</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{totalCanjes}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <span className="material-symbols-outlined text-indigo-400">shopping_cart</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Ventas</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">${totalVentas.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <span className="material-symbols-outlined text-red-400">discount</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Descuentos</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-400">-${totalDescuentos.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <span className="material-symbols-outlined text-green-400">payments</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Total cobrado</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">${totalCobrado.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabla de canjes */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          Detalle de canjes
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Hora</th>
                <th className="px-4 py-3 font-medium">Codigo</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Jugador</th>
                <th className="px-4 py-3 font-medium text-right">Compra</th>
                <th className="px-4 py-3 font-medium text-right">Descuento</th>
                <th className="px-4 py-3 font-medium text-right">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {canjesDelDia.map((canje) => (
                <tr key={canje.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{canje.hora}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{canje.codigo}</td>
                  <td className="px-4 py-3 text-slate-900 dark:text-white hidden sm:table-cell">{canje.jugador}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">${canje.montoCompra.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-400">
                    -${canje.descuento.toLocaleString()}
                    <span className="text-[10px] text-slate-400 ml-1">({canje.tipo})</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                    ${(canje.montoCompra - canje.descuento).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
