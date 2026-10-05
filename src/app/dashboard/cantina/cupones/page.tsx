'use client'

import { useState, useEffect } from 'react'
import { getPuntosConfig, PuntosConfigResponse } from '@/lib/api'
import RegistrarCompraWizard from '@/components/cantina/RegistrarCompraWizard'
import EntregarRecompensaModal from '@/components/cantina/EntregarRecompensaModal'
import CajaHistorial from '@/components/cantina/CajaHistorial'

export default function CantinaCajaPage() {
  const [puntosConfig, setPuntosConfig] = useState<PuntosConfigResponse | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [showEntregar, setShowEntregar] = useState(false)

  useEffect(() => {
    getPuntosConfig().then(setPuntosConfig).catch(() => setPuntosConfig(null))
  }, [])

  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caja</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Registrá cada venta de la cantina y revisá el historial de ventas</p>
      </div>

      {/* === HERO ACTIONS === */}
      <div className="max-w-md mx-auto lg:mx-0 space-y-3">
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="w-full min-h-[96px] bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 text-xl font-bold transition-colors flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-4xl">point_of_sale</span>
          Registrar compra
        </button>
        <button
          type="button"
          onClick={() => setShowEntregar(true)}
          className="w-full min-h-12 bg-white dark:bg-slate-800 border-2 border-primary text-primary hover:bg-primary/5 rounded-lg text-base font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-2xl">redeem</span>
          Recompensas
        </button>
      </div>

      <CajaHistorial refreshKey={historyRefreshKey} />

      <RegistrarCompraWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        puntosActivos={!!puntosConfig?.activo}
        onCompleted={() => setHistoryRefreshKey((k) => k + 1)}
      />
      <EntregarRecompensaModal isOpen={showEntregar} onClose={() => setShowEntregar(false)} />
    </div>
  )
}
