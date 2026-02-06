'use client'

import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
export default function JugadorPerfilPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    window.location.href = '/login'
  }

  const menuItems = [
    { icon: 'person', label: 'Datos personales', href: '#' },
    { icon: 'lock', label: 'Cambiar contraseña', href: '#' },
    { icon: 'notifications', label: 'Notificaciones', href: '#' },
    { icon: 'help', label: 'Ayuda y soporte', href: '#' },
    { icon: 'description', label: 'Términos y condiciones', href: '#' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="flex flex-col items-center py-4 md:py-8">
        <div className="size-24 md:size-28 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-5xl md:text-6xl text-primary">person</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-[#111518] dark:text-white">{user?.name}</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-3 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wide">
          {user?.role}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-2 uppercase tracking-widest px-1">
          Apariencia
        </p>

        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 rounded-full bg-slate-100 dark:bg-slate-700">
              <span className="material-symbols-outlined text-[#617989] dark:text-slate-300">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
            </div>
            <div>
              <p className="font-medium text-[#111518] dark:text-white">Modo oscuro</p>
              <p className="text-xs text-[#617989] dark:text-slate-400">
                {theme === 'dark' ? 'Activado' : 'Desactivado'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-2 uppercase tracking-widest px-1">
          Configuración
        </p>

        <div className="flex flex-col gap-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-center size-10 rounded-full bg-slate-100 dark:bg-slate-700">
                <span className="material-symbols-outlined text-[#617989] dark:text-slate-300">{item.icon}</span>
              </div>
              <span className="flex-1 text-left font-medium text-[#111518] dark:text-white">{item.label}</span>
              <span className="material-symbols-outlined text-[#617989]">chevron_right</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout button */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex mb-7 items-center justify-center gap-2 w-full p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
