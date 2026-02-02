'use client'

import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { useRouter } from 'next/navigation'

export default function JugadorPerfilPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    router.replace('/login')
  }

  const menuItems = [
    { icon: 'person', label: 'Datos personales', href: '#' },
    { icon: 'lock', label: 'Cambiar contraseña', href: '#' },
    { icon: 'notifications', label: 'Notificaciones', href: '#' },
    { icon: 'help', label: 'Ayuda y soporte', href: '#' },
    { icon: 'description', label: 'Términos y condiciones', href: '#' },
  ]

  return (
    <>
      {/* Profile header */}
      <div className="flex flex-col items-center">
        <div className="size-20 sm:size-24 rounded-full bg-primary/20 flex items-center justify-center mb-3 sm:mb-4">
          <span className="material-symbols-outlined text-4xl sm:text-5xl text-primary">person</span>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-[#111518] dark:text-white">{user?.name}</h1>
        <p className="text-xs sm:text-sm text-[#617989] dark:text-slate-400">{user?.email}</p>
        <div className="mt-2 px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold rounded-full uppercase">
          {user?.role}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-2 uppercase tracking-widest px-1">
          Apariencia
        </p>

        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="material-symbols-outlined text-[#617989]">
              {theme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
            <div>
              <p className="font-medium text-[#111518] dark:text-white text-sm sm:text-base">Modo oscuro</p>
              <p className="text-[10px] sm:text-xs text-[#617989] dark:text-slate-400">
                {theme === 'dark' ? 'Activado' : 'Desactivado'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300'
              }`}
          >
            <div
              className={`absolute top-1 w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex flex-col gap-2 mt-10">
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-2 uppercase tracking-widest px-1">
          Configuración
        </p>

        {menuItems.map((item, index) => (
          <button
            key={index}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[#617989]">{item.icon}</span>
            <span className="flex-1 text-left font-medium text-[#111518] dark:text-white text-sm sm:text-base">{item.label}</span>
            <span className="material-symbols-outlined text-[#617989]">chevron_right</span>
          </button>
        ))}
      </div>

      {/* Logout button */}
      <div className='mt-5'>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full p-3 sm:p-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm sm:text-base"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )
}
