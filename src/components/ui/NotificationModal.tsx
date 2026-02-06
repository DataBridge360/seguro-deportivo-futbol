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

const typeConfig: Record<ModalType, {
  icon: string
  gradient: string
  shadow: string
  pulse: string
  btnGradient: string
  btnHover: string
  btnShadow: string
}> = {
  success: {
    icon: 'M5 13l4 4L19 7',
    gradient: 'from-green-400 to-emerald-500',
    shadow: 'shadow-green-500/30',
    pulse: 'bg-green-500/20',
    btnGradient: 'from-green-500 to-emerald-500',
    btnHover: 'hover:from-green-400 hover:to-emerald-400',
    btnShadow: 'shadow-green-500/20',
  },
  error: {
    icon: 'M18 6L6 18M6 6l12 12',
    gradient: 'from-red-400 to-rose-500',
    shadow: 'shadow-red-500/30',
    pulse: 'bg-red-500/20',
    btnGradient: 'from-red-500 to-rose-500',
    btnHover: 'hover:from-red-400 hover:to-rose-400',
    btnShadow: 'shadow-red-500/20',
  },
  info: {
    icon: 'M12 16v-4M12 8h.01',
    gradient: 'from-blue-400 to-sky-500',
    shadow: 'shadow-blue-500/30',
    pulse: 'bg-blue-500/20',
    btnGradient: 'from-blue-500 to-sky-500',
    btnHover: 'hover:from-blue-400 hover:to-sky-400',
    btnShadow: 'shadow-blue-500/20',
  },
  warning: {
    icon: 'M12 9v4M12 17h.01',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    pulse: 'bg-amber-500/20',
    btnGradient: 'from-amber-500 to-orange-500',
    btnHover: 'hover:from-amber-400 hover:to-orange-400',
    btnShadow: 'shadow-amber-500/20',
  },
}

export default function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'Entendido',
}: NotificationModalProps) {
  const config = typeConfig[type]

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_200ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/20 dark:border-slate-700 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-black/40 animate-[modalIn_400ms_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${config.pulse} animate-[ping_1s_ease-out_1]`} />
            <div className={`absolute -inset-2 rounded-full ${config.pulse} opacity-50 animate-[pulse_1.5s_ease-in-out_1]`} />
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.shadow} animate-[bounceIn_500ms_cubic-bezier(0.34,1.56,0.64,1)]`}>
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                <path
                  d={config.icon}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-[drawIcon_400ms_ease-out_300ms_both]"
                  style={{ strokeDasharray: 48, strokeDashoffset: 48 }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="animate-[slideUp_300ms_ease-out_200ms_both]">
          <h2 className="text-[#111518] dark:text-white text-xl font-bold text-center mb-2">{title}</h2>
          <p className="text-[#617989] dark:text-slate-400 text-sm text-center mb-6 leading-relaxed">{message}</p>
        </div>

        {/* Button */}
        <button
          onClick={onClose}
          className={`w-full bg-gradient-to-r ${config.btnGradient} ${config.btnHover} text-white font-bold h-12 rounded-xl shadow-lg ${config.btnShadow} transition-all active:scale-[0.97] animate-[slideUp_300ms_ease-out_350ms_both]`}
        >
          {confirmText}
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawIcon {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
