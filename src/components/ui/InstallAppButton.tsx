'use client'

import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import NotificationModal from './NotificationModal'

export default function InstallAppButton({ className }: { className?: string }) {
  const { isStandalone, isReady, canInstall, isIOS, promptInstall } = usePWA()
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [showModal, setShowModal] = useState(false)

  if (!isReady || isStandalone) return null

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else if (canInstall) {
      await promptInstall()
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleInstall}
        className={className ?? 'w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary font-bold border border-primary/20 hover:bg-primary/15 transition-all'}
      >
        <span className="material-symbols-outlined">download</span>
        Descargar aplicación
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1c2a35] rounded-2xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-[#617989] hover:text-[#111518] dark:hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-[#111518] dark:text-white text-xl font-bold mb-4">Instalar en iOS</h2>
            <p className="text-[#617989] text-sm mb-4">Safari no permite instalación automática. Seguí estos pasos:</p>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <div>
                  <p className="text-[#111518] dark:text-white">Tocá el botón <strong>Compartir</strong></p>
                  <div className="bg-[#f6f7f8] dark:bg-[#0a0a0a] rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">ios_share</span>
                    <span className="text-sm text-[#617989]">Compartir</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <div>
                  <p className="text-[#111518] dark:text-white">Deslizá y seleccioná <strong>&quot;Agregar a Inicio&quot;</strong></p>
                  <div className="bg-[#f6f7f8] dark:bg-[#0a0a0a] rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#617989]">add_box</span>
                    <span className="text-sm text-[#617989]">Agregar a Inicio</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                <p className="text-[#111518] dark:text-white">Tocá <strong>&quot;Agregar&quot;</strong> para confirmar</p>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all mt-6"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type="info"
        title="Cómo instalar"
        message='Para instalar, abrí el menú del navegador y seleccioná "Instalar aplicación" o "Agregar a pantalla de inicio"'
      />
    </>
  )
}
