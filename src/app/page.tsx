'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePWA } from '@/hooks/usePWA'
import { useAuthStore } from '@/stores/authStore'

export default function HomePage() {
  const router = useRouter()
  const { isStandalone, isReady, canInstall, isIOS, promptInstall } = usePWA()
  const { isAuthenticated } = useAuthStore()
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    if (!isReady) return

    if (isStandalone) {
      if (isAuthenticated) {
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }
  }, [isStandalone, isAuthenticated, isReady, router])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center pitch-pattern">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    )
  }

  if (isStandalone) {
    return (
      <div className="min-h-screen flex items-center justify-center pitch-pattern">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
      </div>
    )
  }

  const handleMobileInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true)
    } else if (canInstall) {
      await promptInstall()
    } else {
      alert('Para instalar, abrí el menú del navegador y seleccioná "Instalar aplicación" o "Agregar a pantalla de inicio"')
    }
  }

  const handleDesktopInstall = async () => {
    if (canInstall) {
      await promptInstall()
    } else {
      alert('Para instalar en PC, abrí esta página en Chrome, Edge o Brave y buscá el ícono de instalación en la barra de direcciones')
    }
  }

  const handleWebVersion = () => {
    router.push('/login')
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pitch-pattern">
      {/* Header */}
      <div className="flex items-center p-6 justify-center">
        <h2 className="text-[#111518] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          Seguro Deportivo
        </h2>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 px-6 justify-center pb-20">
        <div className="py-6">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-2xl">
              <span className="material-symbols-outlined text-6xl text-primary">shield</span>
            </div>
          </div>
          <h1 className="text-[#111518] dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
            Seguro Deportivo
          </h1>
          <p className="text-[#111518] dark:text-white/70 text-base font-normal leading-normal pt-2 px-8 text-center max-w-sm mx-auto">
            Gestión de seguros para clubes deportivos
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
          {/* Mobile download */}
          <button
            onClick={handleMobileInstall}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">smartphone</span>
            <span>Descargar para Celular</span>
          </button>

          {/* Desktop download */}
          <button
            onClick={handleDesktopInstall}
            className="w-full bg-white dark:bg-[#1c2a35] hover:bg-gray-50 dark:hover:bg-[#243442] text-[#111518] dark:text-white font-bold h-14 rounded-xl border border-[#dbe1e6] dark:border-[#344857] transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">computer</span>
            <span>Descargar para PC</span>
          </button>

          {/* Separator */}
          <div className="flex items-center w-full gap-4 py-2">
            <div className="h-[1px] bg-[#dbe1e6] dark:bg-[#344857] flex-1"></div>
            <span className="text-[#617989] text-xs font-bold uppercase tracking-widest">o</span>
            <div className="h-[1px] bg-[#dbe1e6] dark:bg-[#344857] flex-1"></div>
          </div>

          {/* Web version */}
          <button
            onClick={handleWebVersion}
            className="w-full bg-primary/10 dark:bg-primary/20 text-primary font-bold h-14 rounded-xl border border-primary/20 transition-all hover:bg-primary/15 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">language</span>
            <span>Usar Versión Web</span>
          </button>
        </div>

        <p className="text-center text-[#617989] text-xs mt-6">
          La app instalada funciona sin conexión y ofrece mejor rendimiento
        </p>
      </div>

      {/* Bottom indicator */}
      <div className="h-8 flex justify-center items-end pb-2">
        <div className="w-32 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1c2a35] rounded-2xl p-6 max-w-md w-full relative animate-slide-up">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-[#617989] hover:text-[#111518] dark:hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-[#111518] dark:text-white text-xl font-bold mb-4">Instalar en iOS</h2>
            <p className="text-[#617989] text-sm mb-4">
              Safari no permite instalación automática. Seguí estos pasos:
            </p>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <div>
                  <p className="text-[#111518] dark:text-white">Tocá el botón <strong>Compartir</strong></p>
                  <div className="bg-[#f6f7f8] dark:bg-[#101a22] rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">ios_share</span>
                    <span className="text-sm text-[#617989]">Compartir</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <div>
                  <p className="text-[#111518] dark:text-white">Deslizá y seleccioná <strong>&quot;Agregar a Inicio&quot;</strong></p>
                  <div className="bg-[#f6f7f8] dark:bg-[#101a22] rounded-lg p-2 mt-2 inline-flex items-center gap-2">
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
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all mt-6"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
