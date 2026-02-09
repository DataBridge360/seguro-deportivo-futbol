'use client'

import { useState } from 'react'
import { MOCK_CUPONES } from '@/lib/mockData'
import type { Cupon } from '@/lib/mockData'

function getEstadoBadge(estado: Cupon['estado']) {
  switch (estado) {
    case 'disponible':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'usado':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
    case 'vencido':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
  }
}

function getEstadoLabel(estado: Cupon['estado']) {
  switch (estado) {
    case 'disponible': return 'Disponible'
    case 'usado': return 'Usado'
    case 'vencido': return 'Vencido'
  }
}

export default function JugadorCuponesPage() {
  const [cuponModal, setCuponModal] = useState<Cupon | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Filtrar cupones del jugador actual (id: '1' para mock)
  const cupones = MOCK_CUPONES.filter(c => c.jugadorId === '1')

  const handleCopiar = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Mis Cupones</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Descuentos exclusivos para jugadores asegurados
        </p>
      </div>

      {/* Lista de cupones */}
      <div className="flex flex-col gap-3">
        {cupones.map((cupon) => (
          <button
            key={cupon.id}
            onClick={() => setCuponModal(cupon)}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-primary/30 transition-all active:scale-[0.98] text-left w-full"
          >
            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
              cupon.estado === 'disponible' ? 'bg-primary/10 text-primary' :
              cupon.estado === 'usado' ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' :
              'bg-red-100 dark:bg-red-500/10 text-red-400'
            }`}>
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-[#111518] dark:text-white text-sm truncate">{cupon.descripcion}</p>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getEstadoBadge(cupon.estado)}`}>
                  {getEstadoLabel(cupon.estado)}
                </span>
              </div>
              <p className="text-xs text-[#617989] dark:text-slate-400">
                {cupon.tipo === 'porcentaje' ? `${cupon.valor}% de descuento` : `$${cupon.valor} de descuento`}
              </p>
              <p className="text-[10px] text-[#617989] dark:text-slate-500 mt-0.5">
                Vence: {new Date(cupon.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#617989]">chevron_right</span>
          </button>
        ))}

        {cupones.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">confirmation_number</span>
            <p className="text-slate-500 dark:text-slate-400">No tenes cupones disponibles</p>
          </div>
        )}
      </div>

      {/* Modal detalle de cupon */}
      {cuponModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setCuponModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className={`size-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                cuponModal.estado === 'disponible' ? 'bg-primary/10 text-primary' :
                cuponModal.estado === 'usado' ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' :
                'bg-red-100 dark:bg-red-500/10 text-red-400'
              }`}>
                <span className="material-symbols-outlined text-4xl">confirmation_number</span>
              </div>
              <h3 className="text-lg font-bold text-[#111518] dark:text-white">{cuponModal.descripcion}</h3>
              <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(cuponModal.estado)}`}>
                {getEstadoLabel(cuponModal.estado)}
              </span>
            </div>

            {/* Codigo */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 mb-4">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Codigo del cupon</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-bold text-[#111518] dark:text-white tracking-wider">{cuponModal.codigo}</p>
                {cuponModal.estado === 'disponible' && (
                  <button
                    onClick={() => handleCopiar(cuponModal.codigo, cuponModal.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedId === cuponModal.id ? 'check' : 'content_copy'}
                    </span>
                    {copiedId === cuponModal.id ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
            </div>

            {/* Detalle */}
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Descuento</span>
                <span className="font-medium text-[#111518] dark:text-white">
                  {cuponModal.tipo === 'porcentaje' ? `${cuponModal.valor}%` : `$${cuponModal.valor}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Vencimiento</span>
                <span className="font-medium text-[#111518] dark:text-white">
                  {new Date(cuponModal.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
                </span>
              </div>
              {cuponModal.canjeadoPor && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Canjeado en</span>
                    <span className="font-medium text-[#111518] dark:text-white">{cuponModal.canjeadoPor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Fecha de canje</span>
                    <span className="font-medium text-[#111518] dark:text-white">
                      {new Date(cuponModal.fechaCanje! + 'T00:00:00').toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setCuponModal(null)}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
