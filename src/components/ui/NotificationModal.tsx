'use client'

import { useEffect } from 'react'

type ModalType = 'success' | 'error' | 'info' | 'warning'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: ModalType
  confirmText?: string
}

const iconMap: Record<ModalType, { icon: string; color: string; bg: string }> = {
  success: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
  error: { icon: 'error', color: 'text-red-500', bg: 'bg-red-500/10' },
  info: { icon: 'info', color: 'text-primary', bg: 'bg-primary/10' },
  warning: { icon: 'warning', color: 'text-amber-500', bg: 'bg-amber-500/10' },
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'Entendido',
}: NotificationModalProps) {
  const { icon, color, bg } = iconMap[type]

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-black/20 border border-white/20 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${bg} p-4 rounded-full`}>
            <span className={`material-symbols-outlined text-4xl ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-[#111518] dark:text-white text-xl font-bold text-center mb-2">
          {title}
        </h2>
        <p className="text-[#617989] dark:text-slate-400 text-sm text-center mb-6 leading-relaxed">
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {confirmText}
        </button>
      </div>
    </div>
  )
}
