'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { CheckCircle2, ChevronRight, Download, PlusSquare, Share, Smartphone, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import NotificationModal from './NotificationModal'

interface InstallAppButtonProps {
  className?: string
  variant?: 'default' | 'banner' | 'hero'
}

export default function InstallAppButton({ className, variant = 'default' }: InstallAppButtonProps) {
  const { isStandalone, isReady, canInstall, isIOS, isIOSSafari, isInAppBrowser, promptInstall } = usePWA()
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
      {variant === 'hero' ? (
        <button
          onClick={handleInstall}
          className={
            className ??
            'group w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-primary text-white text-left shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]'
          }
        >
          <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/15 ring-1 ring-white/25 flex-shrink-0">
            <Smartphone className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex flex-col flex-1 min-w-0">
            <span className="font-bold">Descargar la app</span>
            <span className="text-xs text-white/80">Instalala en tu celular y entrá con un toque</span>
          </span>
          <ChevronRight className="w-5 h-5 text-white/80 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      ) : variant === 'banner' ? (
        <button
          onClick={handleInstall}
          className={
            className ??
            'w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl ring-1 ring-white/60 dark:ring-slate-700/50 shadow-xl shadow-blue-950/20 hover:bg-white dark:hover:bg-slate-900 active:scale-[0.98] transition-all'
          }
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex-shrink-0">
            <Download className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col items-start text-left">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Descargá la app</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Entrá más rápido desde tu celular</span>
          </span>
        </button>
      ) : (
        <button
          onClick={handleInstall}
          className={
            className ??
            'w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary font-bold border border-primary/20 hover:bg-primary/15 transition-all'
          }
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          Descargar aplicación
        </button>
      )}

      {/* Modals are portaled to <body> so a parent stacking context (e.g. the
          login banner wrapper with z-10) cannot paint the login card over them.
          Safe to touch document here: isReady is only true on the client. */}
      {showIOSModal &&
        createPortal(
          <IOSInstallSheet
            onClose={() => setShowIOSModal(false)}
            isIOSSafari={isIOSSafari}
            isInAppBrowser={isInAppBrowser}
          />,
          document.body
        )}

      {createPortal(
        <NotificationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type="info"
          title="Cómo instalar"
          message='Abrí el menú del navegador (⋮) y tocá "Instalar aplicación" o "Agregar a la pantalla principal".'
        />,
        document.body
      )}
    </>
  )
}

function IOSInstallSheet({
  onClose,
  isIOSSafari,
  isInAppBrowser
}: {
  onClose: () => void
  isIOSSafari: boolean
  isInAppBrowser: boolean
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can be unavailable (insecure context, missing permission, or
      // unsupported browser). There is no safe fallback, so we just skip the feedback.
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-[#617989] hover:text-[#111518] dark:hover:text-white"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>

        <h2 id="ios-install-title" className="text-[#111518] dark:text-white text-xl font-bold mb-4 pr-8">
          Instalá la app en tu iPhone
        </h2>

        {isInAppBrowser ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-amber-800 dark:text-amber-300 text-sm mb-3">
              Estás dentro de otra app (WhatsApp, Instagram…). Abrí este link en Safari para poder instalarla.
            </p>
            <button
              onClick={handleCopyLink}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 rounded-lg transition-all"
            >
              {copied ? '¡Link copiado!' : 'Copiar link'}
            </button>
          </div>
        ) : (
          <>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="text-[#111518] dark:text-white">
                    Tocá el botón <strong>Compartir</strong>
                  </p>
                  <p className="text-xs text-[#617989] mt-1">
                    Está en la barra de abajo en Safari. Si no lo ves, tocá ••• (Más) y después Compartir.
                  </p>
                  <div className="bg-[#f6f7f8] dark:bg-slate-900 rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <Share className="w-5 h-5 text-primary" aria-hidden="true" />
                    <span className="text-sm text-[#617989]">Compartir</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="text-[#111518] dark:text-white">
                    Deslizá hacia abajo y tocá <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                  </p>
                  <div className="bg-[#f6f7f8] dark:bg-slate-900 rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <PlusSquare className="w-5 h-5 text-[#617989]" aria-hidden="true" />
                    <span className="text-sm text-[#617989]">Agregar a pantalla de inicio</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="text-[#111518] dark:text-white">
                    Activá <strong>&quot;Abrir como app web&quot;</strong> si aparece y tocá <strong>&quot;Agregar&quot;</strong>
                  </p>
                  <div className="bg-[#f6f7f8] dark:bg-slate-900 rounded-lg p-2 mt-2 inline-flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                    <span className="text-sm text-[#617989]">Agregar</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  4
                </span>
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Ícono de Club Plaza"
                    width={28}
                    height={28}
                    className="w-7 h-7 object-contain rounded"
                  />
                  <p className="text-[#111518] dark:text-white">
                    Listo: abrí Club Plaza desde el ícono en tu pantalla de inicio
                  </p>
                </div>
              </li>
            </ol>

            {!isIOSSafari && (
              <p className="text-xs text-[#617989] mt-4">Si no encontrás la opción, abrí esta página en Safari.</p>
            )}
          </>
        )}

        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all mt-6"
        >
          Entendido
        </button>
      </div>
    </div>
  )
}
