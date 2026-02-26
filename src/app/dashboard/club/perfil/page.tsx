'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { changePassword } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

export default function ClubPerfilPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const [showCambiarPassword, setShowCambiarPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  })

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    window.location.href = '/login'
  }

  const handleOpenCambiarPassword = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setErrors({})
    setShowCambiarPassword(true)
  }

  const handleCambiarPassword = async () => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es obligatoria'
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es obligatoria'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmá la nueva contraseña'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setSubmitting(true)
      await changePassword(currentPassword, newPassword)
      setShowCambiarPassword(false)
      setNotification({
        open: true,
        title: 'Contraseña actualizada',
        message: 'Tu contraseña fue cambiada exitosamente',
        type: 'success'
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      if (msg.toLowerCase().includes('actual') || msg.toLowerCase().includes('incorrecta') || msg.toLowerCase().includes('current')) {
        setErrors({ currentPassword: 'La contraseña actual es incorrecta' })
      } else {
        setNotification({
          open: true,
          title: 'Error al cambiar contraseña',
          message: msg,
          type: 'error'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="flex flex-col items-center py-6">
        <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-primary">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-3 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">
          Club
        </div>
      </div>

      {/* Theme Toggle */}
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">
          Apariencia
        </p>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-600 dark:text-slate-300">
                {theme === 'dark' ? (
                  <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>
                ) : (
                  <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>
                )}
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Modo oscuro</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {theme === 'dark' ? 'Activado' : 'Desactivado'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-600'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Configuración */}
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">
          Configuración
        </p>
        <button
          onClick={handleOpenCambiarPassword}
          className="flex items-center gap-4 p-4 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98] text-left"
        >
          <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-slate-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-600 dark:text-slate-300">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="flex-1 font-medium text-slate-900 dark:text-white">Cambiar contraseña</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400 dark:text-slate-500">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full p-4 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Modal cambiar contraseña */}
      {showCambiarPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowCambiarPassword(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">lock</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cambiar contraseña</h3>
            </div>

            <div className="space-y-4">
              {/* Contraseña actual */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Contraseña actual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      if (errors.currentPassword) setErrors(prev => { const next = { ...prev }; delete next.currentPassword; return next })
                    }}
                    placeholder="Ingresá tu contraseña actual"
                    className={`w-full px-3 py-2.5 pr-10 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                      errors.currentPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showCurrentPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.currentPassword && <p className="text-red-400 text-xs mt-1">{errors.currentPassword}</p>}
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Nueva contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (errors.newPassword) setErrors(prev => { const next = { ...prev }; delete next.newPassword; return next })
                    }}
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full px-3 py-2.5 pr-10 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                      errors.newPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors(prev => { const next = { ...prev }; delete next.confirmPassword; return next })
                  }}
                  placeholder="Repetí la nueva contraseña"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCambiarPassword(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarPassword}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
