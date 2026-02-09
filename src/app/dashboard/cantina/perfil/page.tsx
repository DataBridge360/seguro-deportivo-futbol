'use client'

import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

export default function CantinaPerfilPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    window.location.href = '/login'
  }

  const menuItems = [
    { icon: 'person', label: 'Datos del local' },
    { icon: 'lock', label: 'Cambiar contraseña' },
    { icon: 'help', label: 'Ayuda y soporte' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="flex flex-col items-center py-6">
        <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-5xl text-primary">store</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-3 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">
          Cantina
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
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
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
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">
          Configuración
        </p>
        <div className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-[0.98] text-left"
            >
              <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-slate-700">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">{item.icon}</span>
              </div>
              <span className="flex-1 font-medium text-slate-900 dark:text-white">{item.label}</span>
              <span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full p-4 bg-red-500/10 text-red-400 rounded-xl font-bold hover:bg-red-500/20 transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
