'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'

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
      <Link href="/dashboard/jugador/cupones" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-orange-500/20 transition-all active:scale-[0.98]">
        <div className="size-12 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
          <span className="material-symbols-outlined text-2xl">confirmation_number</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111518] dark:text-white text-base">Ver cupones</p>
          <p className="text-[11px] text-[#617989] dark:text-slate-400">Descuentos exclusivos y beneficios</p>
        </div>
        <span className="material-symbols-outlined text-[#617989] transition-transform group-hover:translate-x-1">chevron_right</span>
      </Link>

      <Link href="/dashboard/jugador/torneos" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-primary/20 transition-all active:scale-[0.98]">
        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <span className="material-symbols-outlined text-2xl">emoji_events</span>
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#111518] dark:text-white text-base">Torneos</p>
          <p className="text-[11px] text-[#617989] dark:text-slate-400">Inscripciones y mis torneos</p>
        </div>
        <span className="material-symbols-outlined text-[#617989] transition-transform group-hover:translate-x-1">chevron_right</span>
      </Link>

      <Link href="/dashboard/jugador/calendario" className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent hover:border-indigo-500/20 transition-all active:scale-[0.98]">
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
    { icon: 'confirmation_number', title: 'Ver cupones', desc: 'Descuentos exclusivos y beneficios', color: 'orange', href: '/dashboard/jugador/cupones' },
    { icon: 'emoji_events', title: 'Torneos', desc: 'Inscripciones y mis torneos', color: 'blue', href: '/dashboard/jugador/torneos' },
    { icon: 'calendar_month', title: 'Calendario', desc: 'Proximos partidos y entrenamientos', color: 'indigo', href: '/dashboard/jugador/calendario' },
    { icon: 'description', title: 'Documentos', desc: 'DNI, ficha medica y contratos', color: 'purple', href: '/dashboard/jugador/documentos' },
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
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [jugadoresTotal, setJugadoresTotal] = useState(0)
  const [equiposTotal, setEquiposTotal] = useState(0)
  const [torneosActivos, setTorneosActivos] = useState(0)
  const [sinSeguro, setSinSeguro] = useState(0)
  const [proximosPartidos, setProximosPartidos] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Importar las funciones API
      const { getJugadores, getEquipos, getTorneos, getPartidos } = await import('@/lib/api')

      // Cargar datos en paralelo
      const [jugadores, equipos, torneos, partidos] = await Promise.all([
        getJugadores(),
        getEquipos(),
        getTorneos(),
        getPartidos()
      ])

      // Calcular estadísticas
      setJugadoresTotal(jugadores.length)
      setEquiposTotal(equipos.length)
      // Torneos activos = próximos + en curso (no finalizados ni cancelados)
      setTorneosActivos(torneos.filter(t => t.estado === 'proximo' || t.estado === 'en_curso').length)

      // Jugadores sin seguro (sin poliza_inicio o poliza_fin, o poliza vencida)
      const hoy = new Date()
      const jugadoresSinSeguro = jugadores.filter(j => {
        if (!j.poliza_inicio || !j.poliza_fin) return true
        const finPoliza = new Date(j.poliza_fin)
        return finPoliza < hoy
      })
      setSinSeguro(jugadoresSinSeguro.length)

      // Próximos partidos (solo programados, ordenados por fecha, máximo 3)
      const hoyStr = new Date().toISOString().split('T')[0]
      const partidosFuturos = partidos
        .filter(p => p.estado === 'programado' && p.fecha >= hoyStr)
        .sort((a, b) => {
          const dateCompare = a.fecha.localeCompare(b.fecha)
          if (dateCompare !== 0) return dateCompare
          return a.hora.localeCompare(b.hora)
        })
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          fecha: p.fecha,
          hora: p.hora,
          equipo: p.equipo_local_nombre,
          rival: p.equipo_visitante_nombre,
          torneo: p.torneo_nombre,
          ubicacion: p.ubicacion || 'Por definir'
        }))

      setProximosPartidos(partidosFuturos)
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

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
          <p className="text-2xl sm:text-3xl font-bold text-indigo-400">{equiposTotal}</p>
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
          {proximosPartidos.length > 0 ? proximosPartidos.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/dashboard/club/partidos/${p.id}`)}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:border-primary transition-colors text-left w-full"
            >
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
            </button>
          )) : (
            <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">event_busy</span>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No hay partidos próximos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Dashboard de Cantina
function CantinaDashboard() {
  const { user } = useAuthStore()

  const cuponesHoy = 5
  const montoTotalHoy = 3500
  const cuponesDisponibles = 12

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Hola, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Resumen del dia</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <span className="material-symbols-outlined text-green-400">check_circle</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Canjes hoy</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-green-400">{cuponesHoy}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Descuentos otorgados</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold">${montoTotalHoy.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <span className="material-symbols-outlined text-amber-400">confirmation_number</span>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Cupones activos</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-400">{cuponesDisponibles}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/cantina/cupones"
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary group-hover:text-white text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Validar cupon</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Escanear o ingresar codigo</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/cantina/cierre"
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white text-indigo-500 transition-colors">
              <span className="material-symbols-outlined text-2xl">calculate</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Cierre de caja</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Resumen y detalle del dia</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  // Redirect productor to jugadores page
  useEffect(() => {
    if (user?.role === 'productor') {
      router.replace('/dashboard/productor/jugadores')
    }
  }, [user?.role, router])

  if (user?.role === 'jugador') {
    return <JugadorDashboard />
  }

  if (user?.role === 'productor') {
    return null // Redirecting...
  }

  if (user?.role === 'club') {
    return <ClubDashboard />
  }

  if (user?.role === 'cantina') {
    return <CantinaDashboard />
  }

  return <AdminDashboard />
}
