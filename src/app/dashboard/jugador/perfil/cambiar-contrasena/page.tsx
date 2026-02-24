'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changePassword } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

const MIN_LENGTH = 8

export default function CambiarContrasenaPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success',
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Ingresa la nueva contraseña'
    } else if (newPassword.length < MIN_LENGTH) {
      newErrors.newPassword = `Debe tener al menos ${MIN_LENGTH} caracteres`
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma la nueva contraseña'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      await changePassword(currentPassword, newPassword)
      setNotification({
        open: true,
        title: 'Contraseña actualizada',
        message: 'Tu contraseña fue cambiada correctamente',
        type: 'success',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cambiar la contraseña',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }))
    if (notification.type === 'success') {
      router.push('/dashboard/jugador/perfil')
    }
  }

  const isFormValid = currentPassword && newPassword.length >= MIN_LENGTH && confirmPassword === newPassword && currentPassword !== newPassword

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Cambiar contraseña</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Ingresa tu contraseña actual y la nueva contraseña
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Contraseña actual */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
            Contraseña actual
          </label>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
            <div className="flex-1 relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }))
                }}
                placeholder="Tu contraseña actual"
                className={`w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                  errors.currentPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-lg">
                  {showCurrent ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          {errors.currentPassword && <p className="text-red-400 text-xs mt-2 ml-10">{errors.currentPassword}</p>}
        </div>

        {/* Nueva contraseña */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
            Nueva contraseña
          </label>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg">lock_reset</span>
            <div className="flex-1 relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }))
                }}
                placeholder="Minimo 8 caracteres"
                className={`w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                  errors.newPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-lg">
                  {showNew ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          {errors.newPassword && <p className="text-red-400 text-xs mt-2 ml-10">{errors.newPassword}</p>}
          {/* Indicador de longitud */}
          {newPassword && !errors.newPassword && (
            <div className="flex items-center gap-2 mt-2 ml-10">
              <span className={`material-symbols-outlined text-sm ${newPassword.length >= MIN_LENGTH ? 'text-green-500' : 'text-slate-400'}`}>
                {newPassword.length >= MIN_LENGTH ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <p className={`text-xs ${newPassword.length >= MIN_LENGTH ? 'text-green-500' : 'text-slate-400'}`}>
                {newPassword.length}/{MIN_LENGTH} caracteres
              </p>
            </div>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
            Confirmar nueva contraseña
          </label>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg">lock_reset</span>
            <div className="flex-1 relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                }}
                placeholder="Repeti la nueva contraseña"
                className={`w-full text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-lg">
                  {showConfirm ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-2 ml-10">{errors.confirmPassword}</p>}
          {/* Indicador de coincidencia */}
          {confirmPassword && !errors.confirmPassword && (
            <div className="flex items-center gap-2 mt-2 ml-10">
              <span className={`material-symbols-outlined text-sm ${confirmPassword === newPassword ? 'text-green-500' : 'text-amber-500'}`}>
                {confirmPassword === newPassword ? 'check_circle' : 'error'}
              </span>
              <p className={`text-xs ${confirmPassword === newPassword ? 'text-green-500' : 'text-amber-500'}`}>
                {confirmPassword === newPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boton guardar */}
      <button
        onClick={handleSubmit}
        disabled={saving || !isFormValid}
        className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors active:scale-[0.98] ${
          isFormValid
            ? 'bg-primary hover:bg-primary/90 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
        } disabled:opacity-50`}
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Cambiando...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">lock_reset</span>
            Cambiar contraseña
          </>
        )}
      </button>

      <NotificationModal
        isOpen={notification.open}
        onClose={handleNotificationClose}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
