'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import Link from 'next/link'

// Modal QR
function QRModal({ isOpen, onClose, dni }: { isOpen: boolean; onClose: () => void; dni: string }) {
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
            <QRCodeSVG value={dni} size={192} level="H" />
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
      {/* Background club logo */}
      <div className={`absolute pointer-events-none ${isDesktop ? '-right-10 -bottom-10 group-hover:scale-110 transition-transform duration-700' : 'right-[-30px] bottom-[-30px]'}`}>
        <Image
          src="/logo.png"
          alt=""
          width={isDesktop ? 320 : 360}
          height={isDesktop ? 320 : 360}
          className="opacity-[0.12] rotate-12"
          style={{ filter: 'brightness(2) grayscale(0.3)' }}
        />
      </div>

      {/* Card content */}
      <div className={`relative ${isDesktop ? '' : 'h-full p-5'} flex flex-col ${isDesktop ? 'gap-6' : 'justify-between'}`}>
        {/* Top section - Name */}
        <div className={`flex justify-between items-start ${isDesktop ? 'mb-2' : ''} relative z-10`}>
          <div>
            <h1 className={`${isDesktop ? 'text-2xl' : 'text-2xl'} font-bold leading-tight tracking-tight`}>
              {memberData.name}
            </h1>
            <p className={`${isDesktop ? 'text-sky-100 text-sm' : 'text-xs'} opacity-90 mt-0.5`}>{memberData.club}</p>
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
          {memberData.status === 'activo' ? (
            <span className={`${isDesktop ? 'bg-emerald-400 text-emerald-950 text-[10px] font-black px-3 py-1 ring-4 ring-emerald-400/20' : 'bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 text-[10px] px-2.5 py-0.5'} rounded-full uppercase tracking-wider font-bold`}>
              PAGADO
            </span>
          ) : (
            <span className={`${isDesktop ? 'bg-red-400 text-red-950 text-[10px] font-black px-3 py-1 ring-4 ring-red-400/20' : 'bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 text-[10px] px-2.5 py-0.5'} rounded-full uppercase tracking-wider font-bold`}>
              NO PAGADO
            </span>
          )}
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

    </div>
  )
}

// Atajos rapidos para desktop (grid 2x2)
function DesktopShortcuts() {
  const shortcuts = [
    { icon: 'confirmation_number', title: 'Ver cupones', desc: 'Descuentos exclusivos y beneficios', color: 'orange', href: '/dashboard/jugador/cupones' },
    { icon: 'emoji_events', title: 'Torneos', desc: 'Inscripciones y mis torneos', color: 'blue', href: '/dashboard/jugador/torneos' },
    // { icon: 'description', title: 'Documentos', desc: 'DNI, ficha medica y contratos', color: 'purple', href: '/dashboard/jugador/documentos' },
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

// Componente del dashboard para jugador
function JugadorDashboard() {
  const { user } = useAuthStore()
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dniRaw, setDniRaw] = useState('')
  const [memberData, setMemberData] = useState({
    name: user?.name || 'Usuario',
    club: '',
    dni: '',
    birthDate: '',
    insuranceStart: '',
    insuranceEnd: '',
    status: 'activo',
  })

  useEffect(() => {
    loadPerfil()
  }, [])

  const loadPerfil = async () => {
    try {
      const { getJugadorPerfil, getPolizaActiva } = await import('@/lib/api')
      const [perfil, poliza] = await Promise.all([
        getJugadorPerfil(),
        getPolizaActiva(),
      ])

      const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }

      const clubNombre = perfil.clubes?.[0]?.nombre || ''

      setDniRaw(perfil.dni)
      setMemberData({
        name: perfil.nombre_completo || user?.name || 'Usuario',
        club: clubNombre,
        dni: perfil.dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
        birthDate: formatDate(perfil.fecha_nacimiento),
        insuranceStart: poliza ? formatDate(poliza.fecha_inicio) : '-',
        insuranceEnd: poliza ? formatDate(poliza.fecha_fin) : '-',
        status: perfil.pagado ? 'activo' : 'inactivo',
      })
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <QRModal isOpen={showQR} onClose={() => setShowQR(false)} dni={dniRaw} />

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

          {/* Right column - Shortcuts */}
          <div className="lg:col-span-7">
            <h2 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">Atajos Rapidos</h2>
            <DesktopShortcuts />
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

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()

  // Redirect roles that don't use /dashboard as home
  useEffect(() => {
    if (user?.role === 'productor') {
      router.replace('/dashboard/productor/jugadores')
    } else if (user?.role === 'club') {
      router.replace('/dashboard/club/torneos')
    } else if (user?.role === 'cantina') {
      router.replace('/dashboard/cantina/cupones')
    }
  }, [user?.role, router])

  if (user?.role === 'jugador') {
    return <JugadorDashboard />
  }

  if (user?.role === 'productor' || user?.role === 'club' || user?.role === 'cantina') {
    return null // Redirecting...
  }

  return <AdminDashboard />
}
