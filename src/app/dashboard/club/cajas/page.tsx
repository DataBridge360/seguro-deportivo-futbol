'use client'

import CajasClubView from '@/components/cantina/CajasClubView'
import { useAuthStore } from '@/stores/authStore'

export default function CajasPage() {
  const accesoLimitado = useAuthStore((state) => state.user?.acceso_limitado === true)

  if (accesoLimitado) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <span className="material-symbols-outlined text-4xl text-slate-400">lock</span>
        <h1 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Sin acceso a las cajas</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Las cajas solo las ve el responsable del club.</p>
      </div>
    )
  }

  return <CajasClubView />
}
