'use client'

import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

export default function ClubPerfilPage() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  const handleLogout = () => {
    document.cookie = 'auth-storage=; path=/; max-age=0'
    logout()
    window.location.href = '/login'
  }

  const menuItems = [
    { icon: 'person', label: 'Datos personales' },
    { icon: 'lock', label: 'Cambiar contraseña' },
    { icon: 'help', label: 'Ayuda y soporte' },
  ]

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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-600 dark:text-slate-300">
                  {item.icon === 'person' && (
                    <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
                  )}
                  {item.icon === 'lock' && (
                    <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                  )}
                  {item.icon === 'help' && (
                    <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" /></>
                  )}
                </svg>
              </div>
              <span className="flex-1 font-medium text-slate-900 dark:text-white">{item.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400 dark:text-slate-500">
                <polyline points="9 18 15 12 9 6" />
              </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
