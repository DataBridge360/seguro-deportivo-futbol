'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { MOCK_JUGADORES, formatDate as formatDateShortFn } from '@/lib/mockData'

// Modal QR
function QRModal({ isOpen, onClose, memberId }: { isOpen: boolean; onClose: () => void; memberId: string }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h3 className="text-lg font-bold text-[#111518] dark:text-white mb-4">Codigo QR</h3>
          <div className="bg-white p-4 rounded-xl inline-block mb-4">
            {/* Placeholder QR - en produccion usar libreria de QR */}
            <div className="w-48 h-48 bg-[#111518] rounded-lg flex items-center justify-center relative">
              <div className="absolute inset-4 border-4 border-white rounded"></div>
              <span className="text-white text-xs font-mono">{memberId}</span>
            </div>
          </div>
          <p className="text-sm text-[#617989] dark:text-slate-400 mb-4">
            Mostra este codigo para verificar tu identidad
          </p>
          <button
            onClick={onClose}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Tarjeta de credencial reutilizable
function CredentialCard({ memberData, onShowQR, variant = 'mobile' }: {
  memberData: any;
  onShowQR: () => void;
  variant?: 'mobile' | 'desktop';
}) {
  const isDesktop = variant === 'desktop'

  return (
    <div
      className={`relative overflow-hidden text-white shadow-xl ${
        isDesktop
          ? 'rounded-2xl p-6 shadow-primary/20'
          : 'w-full aspect-[1.7/1] rounded-[24px] shadow-2xl border border-white/10'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(3, 105, 161, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Background decoration */}
      <div className={`absolute opacity-10 pointer-events-none ${isDesktop ? '-right-4 -bottom-4 group-hover:scale-110 transition-transform duration-700' : 'inset-0 overflow-hidden'}`}>
        <span className={`material-symbols-outlined ${isDesktop ? 'text-[180px]' : 'text-[240px] absolute -right-8 -bottom-8 rotate-12'}`}>
          sports_soccer
        </span>
      </div>

      {/* Card content */}
      <div className={`relative ${isDesktop ? '' : 'h-full p-5'} flex flex-col ${isDesktop ? 'gap-6' : 'justify-between'}`}>
        {/* Top section - Name left, ID right */}
        <div className={`flex justify-between items-start ${isDesktop ? 'mb-2' : ''} relative z-10`}>
          <div>
            <h1 className={`${isDesktop ? 'text-2xl' : 'text-2xl'} font-bold leading-tight tracking-tight`}>
              {memberData.name}
            </h1>
            <p className={`${isDesktop ? 'text-sky-100 text-sm' : 'text-xs'} opacity-90 mt-0.5`}>{memberData.club}</p>
          </div>
          <div className="text-right">
            <p className={`${isDesktop ? 'text-[10px] text-sky-200' : 'text-[9px] opacity-60'} uppercase font-bold tracking-wider`}>ID de Socio</p>
            <p className={`${isDesktop ? 'text-sm' : 'text-sm'} font-mono tracking-wider font-medium`}>#{memberData.id}</p>
          </div>
        </div>

        {/* QR Button */}
        <div className={`flex ${isDesktop ? 'justify-end mb-2' : 'justify-end'} relative z-10`}>
          <button
            onClick={onShowQR}
            className={`flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-bold border border-white/30 hover:bg-white/30 transition-all ${isDesktop ? 'text-xs' : 'text-[10px]'}`}
          >
            <span className={`material-symbols-outlined ${isDesktop ? 'text-sm' : 'text-lg'}`}>qr_code_2</span>
            VER QR
          </button>
        </div>

        {/* DNI and Birth date */}
        <div className={`grid grid-cols-2 gap-4 ${isDesktop ? 'mb-2' : ''} relative z-10`}>
          <div>
            <p className={`${isDesktop ? 'text-[10px] text-sky-200' : 'text-[8px] opacity-60'} uppercase font-bold tracking-wider`}>DNI</p>
            <p className={`${isDesktop ? 'font-bold' : 'text-xs font-semibold'}`}>{memberData.dni}</p>
          </div>
          <div>
            <p className={`${isDesktop ? 'text-[10px] text-sky-200' : 'text-[8px] opacity-60'} uppercase font-bold tracking-wider`}>Nacimiento</p>
            <p className={`${isDesktop ? 'font-bold' : 'text-xs font-semibold'}`}>{memberData.birthDate}</p>
          </div>
        </div>

        {/* Separator and insurance validity */}
        <div className={`${isDesktop ? 'pt-6' : 'pt-2'} border-t border-white/20 flex items-center justify-between relative z-10`}>
          <div>
            <p className={`${isDesktop ? 'text-[10px] text-sky-200' : 'text-[8px] opacity-60'} uppercase font-bold tracking-wider`}>Vigencia del Seguro</p>
            <p className={`${isDesktop ? 'text-sm font-semibold' : 'text-xs font-semibold'}`}>{memberData.insuranceStart} - {memberData.insuranceEnd}</p>
          </div>
          <span className={`${isDesktop ? 'bg-emerald-400 text-emerald-950 text-[10px] font-black px-3 py-1 ring-4 ring-emerald-400/20' : 'bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 text-[10px] px-2.5 py-0.5'} rounded-full uppercase tracking-wider font-bold`}>
            ACTIVO
          </span>
        </div>
      </div>
    </div>
  )
}

// Atajos rapidos para mobile
function MobileShortcuts() {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/dashboard/jugador/equipo" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]">
        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <span className="material-symbols-outlined text-2xl">groups</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111518] dark:text-white text-base">Ver mi equipo</p>
          <p className="text-[11px] text-[#617989] dark:text-slate-400">Plantel, posiciones y estadisticas</p>
        </div>
        <span className="material-symbols-outlined text-[#617989] transition-transform group-hover:translate-x-1">chevron_right</span>
      </Link>

      <Link href="/dashboard/jugador/beneficios" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-orange-500/20 transition-all active:scale-[0.98]">
        <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
          <span className="material-symbols-outlined text-2xl">confirmation_number</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111518] dark:text-white text-base">Ver cupones</p>
          <p className="text-[11px] text-[#617989] dark:text-slate-400">Descuentos exclusivos y beneficios</p>
        </div>
        <span className="material-symbols-outlined text-[#617989] transition-transform group-hover:translate-x-1">chevron_right</span>
      </Link>

      <Link href="/dashboard/jugador/partidos" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-indigo-500/20 transition-all active:scale-[0.98]">
        <div className="size-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white">
          <span className="material-symbols-outlined text-2xl">calendar_month</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111518] dark:text-white text-base">Calendario</p>
          <p className="text-[11px] text-[#617989] dark:text-slate-400">Proximos partidos y entrenamientos</p>
        </div>
        <span className="material-symbols-outlined text-[#617989] transition-transform group-hover:translate-x-1">chevron_right</span>
      </Link>
    </div>
  )
}

// Atajos rapidos para desktop (grid 2x2)
function DesktopShortcuts() {
  const shortcuts = [
    { icon: 'group', title: 'Ver mi equipo', desc: 'Plantel, posiciones y estadisticas', color: 'blue', href: '/dashboard/jugador/equipo' },
    { icon: 'confirmation_number', title: 'Ver cupones', desc: 'Descuentos exclusivos y beneficios', color: 'orange', href: '/dashboard/jugador/beneficios' },
    { icon: 'calendar_month', title: 'Calendario', desc: 'Proximos partidos y entrenamientos', color: 'indigo', href: '/dashboard/jugador/partidos' },
    { icon: 'person', title: 'Mi Perfil', desc: 'Configuracion y datos personales', color: 'purple', href: '/dashboard/jugador/perfil' },
  ]

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shortcuts.map((shortcut, idx) => (
        <Link
          key={idx}
          href={shortcut.href}
          className="group flex items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all duration-300"
        >
          <div className={`${colorClasses[shortcut.color]} p-3 rounded-lg mr-4 group-hover:scale-110 transition-transform`}>
            <span className="material-symbols-outlined">{shortcut.icon}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 dark:text-white">{shortcut.title}</h4>
            <p className="text-xs text-slate-500">{shortcut.desc}</p>
          </div>
          <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
        </Link>
      ))}
    </div>
  )
}

// Proximo partido (desktop only)
function NextMatch() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-300">shield</span>
        </div>
        <span className="font-bold text-sm text-slate-900 dark:text-white">River Plate</span>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full mb-2">LIGA PROFESIONAL</span>
        <div className="flex items-center gap-6">
          <span className="text-3xl font-black text-slate-300 dark:text-slate-600">VS</span>
        </div>
        <p className="mt-4 font-bold text-2xl text-slate-900 dark:text-white">Domingo 15:30</p>
        <p className="text-xs text-slate-500">Estadio Monumental</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-slate-600 dark:text-slate-300">shield</span>
        </div>
        <span className="font-bold text-sm text-slate-900 dark:text-white">Boca Juniors</span>
      </div>
    </div>
  )
}

// Componente del dashboard para jugador
function JugadorDashboard() {
  const { user } = useAuthStore()
  const [showQR, setShowQR] = useState(false)

  const memberData = {
    id: 'SC-2024-9981',
    name: user?.name || 'Usuario',
    club: 'River Plate',
    dni: '44.201.327',
    birthDate: '05/11/2002',
    insuranceStart: '02/03/2025',
    insuranceEnd: '02/03/2026',
    status: 'activo',
  }

  return (
    <>
      <QRModal isOpen={showQR} onClose={() => setShowQR(false)} memberId={memberData.id} />

      {/* Mobile Layout */}
      <div className="md:hidden space-y-6">
        {/* Credencial Digital */}
        <div>
          <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-4 uppercase tracking-widest px-1">
            Credencial Digital
          </p>
          <CredentialCard memberData={memberData} onShowQR={() => setShowQR(true)} variant="mobile" />
        </div>

        {/* Atajos Rapidos */}
        <div>
          <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-4 uppercase tracking-widest px-1">
            Atajos Rapidos
          </p>
          <MobileShortcuts />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - Credential */}
          <div className="lg:col-span-5">
            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">Credencial Digital</h2>
            <div className="group">
              <CredentialCard memberData={memberData} onShowQR={() => setShowQR(true)} variant="desktop" />
            </div>
          </div>

          {/* Right column - Shortcuts and Match */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">Atajos Rapidos</h2>
              <DesktopShortcuts />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Proximo Partido</h2>
                <button className="text-primary text-xs font-bold hover:underline">Ver fixture completo</button>
              </div>
              <NextMatch />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Datos del productor derivados del mock centralizado
const MOCK_JUGADORES_PRODUCTOR = MOCK_JUGADORES.map(j => ({
  id: j.id,
  nombreCompleto: j.nombreCompleto,
  dni: j.dni,
  club: j.club,
  seguroFin: j.seguroFin,
}))

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// Dashboard especifico del productor
function ProductorDashboard() {
  const { user } = useAuthStore()

  const now = new Date()
  const [jugadores, setJugadores] = useState(MOCK_JUGADORES_PRODUCTOR)
  const total = jugadores.length
  const inactivos = jugadores.filter(j => new Date(j.seguroFin) < now)
  const activos = total - inactivos.length

  // Modal de renovacion
  const [renewModal, setRenewModal] = useState<{ open: boolean; jugador: typeof MOCK_JUGADORES_PRODUCTOR[0] | null }>({ open: false, jugador: null })
  const [renewInicio, setRenewInicio] = useState('')
  const [renewDuracion, setRenewDuracion] = useState<'mensual' | 'trimestral' | 'semestral' | 'anual'>('anual')

  // Notificacion
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const calcRenewFin = (inicio: string, duracion: string): string => {
    if (!inicio) return ''
    const d = new Date(inicio + 'T00:00:00')
    switch (duracion) {
      case 'mensual': d.setMonth(d.getMonth() + 1); break
      case 'trimestral': d.setMonth(d.getMonth() + 3); break
      case 'semestral': d.setMonth(d.getMonth() + 6); break
      case 'anual': d.setFullYear(d.getFullYear() + 1); break
    }
    return d.toISOString().split('T')[0]
  }

  const handleRenewClick = (jugador: typeof MOCK_JUGADORES_PRODUCTOR[0]) => {
    setRenewModal({ open: true, jugador })
    setRenewInicio(new Date().toISOString().split('T')[0])
    setRenewDuracion('anual')
  }

  const handleRenewConfirm = () => {
    if (!renewModal.jugador || !renewInicio) return
    const jugador = renewModal.jugador
    const newEndStr = calcRenewFin(renewInicio, renewDuracion)

    setJugadores(prev => prev.map(j =>
      j.id === jugador.id ? { ...j, seguroFin: newEndStr } : j
    ))
    setRenewModal({ open: false, jugador: null })
    setNotification({
      open: true,
      title: 'Seguro renovado',
      message: `El seguro de ${jugador.nombreCompleto} se renovo desde el ${formatDateShort(renewInicio)} hasta el ${formatDateShort(newEndStr)}.`,
      type: 'success'
    })
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Hola, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Resumen de tu cartera de asegurados</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Total Jugadores</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{total}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Activos</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{activos}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-400">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Sin seguro</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-400">{inactivos.length}</p>
        </div>
      </div>

      {/* Tabla de inactivos */}
      {inactivos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Jugadores sin seguro
            </h2>
            <Link
              href="/dashboard/productor/jugadores"
              className="text-primary text-xs font-medium hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-left">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">Club</th>
                  <th className="px-4 py-3 font-medium">Vencio</th>
                  <th className="px-4 py-3 font-medium text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {inactivos.map((j) => (
                  <tr key={j.id} className="border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{j.nombreCompleto}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:hidden">{j.club}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{j.dni}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden sm:table-cell">{j.club}</td>
                    <td className="px-4 py-3 text-red-400 text-xs font-medium">{formatDateShort(j.seguroFin)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRenewClick(j)}
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" x2="12" y1="9" y2="15" /><line x1="9" x2="15" y1="12" y2="12" />
                        </svg>
                        Renovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Renovacion */}
      {renewModal.open && renewModal.jugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setRenewModal({ open: false, jugador: null })}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/10 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" x2="12" y1="9" y2="15" /><line x1="9" x2="15" y1="12" y2="12" />
                </svg>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-1">Renovar seguro</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              <strong className="text-slate-900 dark:text-white">{renewModal.jugador.nombreCompleto}</strong>
            </p>

            {/* Fecha de inicio */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">Fecha de inicio de vigencia</label>
              <DatePicker
                value={renewInicio}
                onChange={setRenewInicio}
                placeholder="Seleccionar fecha"
              />
            </div>

            {/* Duracion */}
            <div className="mb-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">Duracion del seguro</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'mensual', label: 'Mensual', desc: '1 mes' },
                  { value: 'trimestral', label: 'Trimestral', desc: '3 meses' },
                  { value: 'semestral', label: 'Semestral', desc: '6 meses' },
                  { value: 'anual', label: 'Anual', desc: '12 meses' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRenewDuracion(opt.value)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all ${
                      renewDuracion === opt.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      renewDuracion === opt.value ? 'border-green-500' : 'border-slate-400 dark:border-slate-500'
                    }`}>
                      {renewDuracion === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${renewDuracion === opt.value ? 'text-green-400' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen */}
            {renewInicio && (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-5 text-sm">
                <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Inicio:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{formatDateShort(renewInicio)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Finalizacion:</span>
                  <span className="text-green-400 font-medium">{formatDateShort(calcRenewFin(renewInicio, renewDuracion))}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setRenewModal({ open: false, jugador: null })}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenewConfirm}
                disabled={!renewInicio}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirmar Renovacion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificacion */}
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

// Componente del dashboard para admin
function AdminDashboard() {
  const { user } = useAuthStore()

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Bienvenido, {user?.name}!
      </h1>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Tu Rol</h3>
          <p className="text-xl sm:text-2xl font-bold capitalize mt-1">{user?.role}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Usuarios Activos</h3>
          <p className="text-xl sm:text-2xl font-bold mt-1">156</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Polizas Vigentes</h3>
          <p className="text-xl sm:text-2xl font-bold mt-1">89</p>
        </div>
      </div>
    </div>
  )
}

// Dashboard del Club
function ClubDashboard() {
  const { user } = useAuthStore()

  const jugadoresTotal = 45
  const equipos = 3
  const torneosActivos = 2
  const sinSeguro = 8

  const proximosPartidos = [
    { id: '1', fecha: '2026-02-14', hora: '15:30', equipo: 'River Plate', rival: 'Boca Juniors', torneo: 'Liga Profesional', ubicacion: 'Estadio Monumental' },
    { id: '2', fecha: '2026-02-18', hora: '17:00', equipo: 'Racing Club', rival: 'Independiente', torneo: 'Copa Argentina', ubicacion: 'Estadio Cilindro' },
    { id: '3', fecha: '2026-02-22', hora: '10:00', equipo: 'San Lorenzo', rival: 'River Plate', torneo: 'Liga Profesional', ubicacion: 'Estadio Nuevo Gasometro' },
  ]

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Hola, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Resumen de tu club</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Jugadores</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">{jugadoresTotal}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Equipos</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-400">{equipos}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-400">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Torneos</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400">{torneosActivos}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-red-400">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium">Sin seguro</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-400">{sinSeguro}</p>
        </div>
      </div>

      {/* Proximos partidos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Proximos partidos
          </h2>
          <Link
            href="/dashboard/club/calendario"
            className="text-primary text-xs font-medium hover:underline"
          >
            Ver calendario
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {proximosPartidos.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
              <div className="text-center min-w-[50px]">
                <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{p.hora}</p>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {p.equipo} vs {p.rival}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.torneo} · {p.ubicacion}</p>
              </div>
              <span className="hidden sm:inline-flex px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {p.equipo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  if (user?.role === 'jugador') {
    return <JugadorDashboard />
  }

  if (user?.role === 'productor') {
    return <ProductorDashboard />
  }

  if (user?.role === 'club') {
    return <ClubDashboard />
  }

  return <AdminDashboard />
}
