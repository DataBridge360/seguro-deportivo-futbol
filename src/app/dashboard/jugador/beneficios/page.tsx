'use client'

import { useState } from 'react'

interface Beneficio {
  id: number
  title: string
  store: string
  expires: string
  icon: string
  color: string
  code: string
}

export default function JugadorBeneficiosPage() {
  const [selectedBeneficio, setSelectedBeneficio] = useState<Beneficio | null>(null)
  const [copied, setCopied] = useState(false)

  const beneficios: Beneficio[] = [
    { id: 1, title: '20% OFF en Indumentaria', store: 'SportShop', expires: '31/03/2025', icon: 'checkroom', color: 'orange', code: 'SPORT20OFF' },
    { id: 2, title: '15% OFF en Suplementos', store: 'NutriStore', expires: '15/04/2025', icon: 'nutrition', color: 'green', code: 'NUTRI15' },
    { id: 3, title: '2x1 en Bebidas', store: 'HidraMax', expires: '28/02/2025', icon: 'water_drop', color: 'blue', code: 'HIDRA2X1' },
    { id: 4, title: '30% OFF en Calzado', store: 'RunnersPro', expires: '20/05/2025', icon: 'steps', color: 'purple', code: 'RUNNERS30' },
  ]

  const colorClasses: Record<string, { bg: string; text: string }> = {
    orange: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-500' },
    green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-500' },
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCloseModal = () => {
    setSelectedBeneficio(null)
    setCopied(false)
  }

  return (
    <>
      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 uppercase tracking-widest px-1">
            Mis Beneficios
          </p>
          <span className="text-xs text-[#617989] dark:text-slate-400">
            {beneficios.length} disponibles
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#e5e7eb] dark:border-slate-700 divide-y divide-[#e5e7eb] dark:divide-slate-700 overflow-hidden">
          {beneficios.map((beneficio) => {
            const colors = colorClasses[beneficio.color] || colorClasses.orange
            return (
              <div
                key={beneficio.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <div className={`size-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text} shrink-0`}>
                  <span className="material-symbols-outlined text-2xl">{beneficio.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111518] dark:text-white truncate">{beneficio.title}</p>
                  <p className="text-xs text-[#617989] dark:text-slate-400">{beneficio.store} · Vence: {beneficio.expires}</p>
                </div>
                <button
                  onClick={() => setSelectedBeneficio(beneficio)}
                  className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-lg hover:bg-primary/20 transition-colors shrink-0"
                >
                  Ver cupón
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-[#617989] dark:text-slate-400 text-center px-4">
          Presentá tu carnet digital al momento de usar el cupón.
        </p>
      </div>

      {/* Modal */}
      {selectedBeneficio && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#111518] dark:text-white">{selectedBeneficio.title}</h3>
                <p className="text-sm text-[#617989] dark:text-slate-400">{selectedBeneficio.store}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-[#617989] hover:text-[#111518] dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-gray-100 dark:bg-slate-700 rounded-xl p-4 text-center mb-4">
              <p className="text-xs text-[#617989] dark:text-slate-400 mb-2">Tu código de descuento</p>
              <p className="text-2xl font-mono font-bold text-[#111518] dark:text-white tracking-wider">
                {selectedBeneficio.code}
              </p>
            </div>

            <button
              onClick={() => handleCopyCode(selectedBeneficio.code)}
              className={`w-full font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden relative ${
                copied
                  ? 'bg-green-500 text-white scale-[1.02]'
                  : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl transition-all duration-300 ${
                  copied ? 'animate-[bounceIn_0.4s_ease-out]' : ''
                }`}
              >
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              <span className={`transition-all duration-300 ${copied ? 'animate-[slideIn_0.3s_ease-out]' : ''}`}>
                {copied ? '¡Copiado!' : 'Copiar código'}
              </span>
            </button>

            <p className="text-xs text-[#617989] dark:text-slate-400 text-center mt-4">
              Válido hasta {selectedBeneficio.expires}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
