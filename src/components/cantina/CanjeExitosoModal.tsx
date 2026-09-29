'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  montoDescuento: number
  montoTotal: number
  // null when crediting points failed; 0 when nothing was credited
  puntosAcreditados: number | null
  saldoPuntos?: number
  puntosActivos: boolean
}

export default function CanjeExitosoModal({
  isOpen,
  onClose,
  montoDescuento,
  montoTotal,
  puntosAcreditados,
  saldoPuntos,
  puntosActivos,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 max-h-[90dvh] overflow-y-auto">
        <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cupón canjeado</h2>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Descuento de ${Number(montoDescuento).toLocaleString()} aplicado.
          <br />
          Total a cobrar: <span className="font-bold">${Number(montoTotal).toLocaleString()}</span>
        </p>

        {puntosAcreditados === null && (
          <p className="text-sm text-amber-600 dark:text-amber-400">No se pudieron cargar los puntos</p>
        )}
        {puntosAcreditados !== null && puntosAcreditados > 0 && (
          <div className="bg-primary/10 rounded-xl p-4">
            <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-3xl">stars</span>+{puntosAcreditados} puntos
            </p>
            {saldoPuntos !== undefined && (
              <p className="text-base text-slate-600 dark:text-slate-300 mt-1">Saldo: {saldoPuntos} puntos</p>
            )}
          </div>
        )}
        {puntosAcreditados === 0 && !puntosActivos && (
          <p className="text-base text-slate-500 dark:text-slate-400">Sin puntos: el club no tiene puntos activos</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-medium transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>,
    document.body,
  )
}
