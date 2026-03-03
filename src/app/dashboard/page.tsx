'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import Link from 'next/link'
import { getMisCupones, CuponResponse } from '@/lib/api'

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

// Tarjeta de credencial original
function CredentialCard({ memberData, onShowQR }: {
  memberData: any;
  onShowQR: () => void;
}) {
  return (
    <div
      className="relative overflow-hidden text-white w-full aspect-[1.7/1] rounded-[24px] shadow-2xl border border-white/10"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.9) 0%, rgba(3, 105, 161, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Background club logo */}
      <div className="absolute pointer-events-none right-[-30px] bottom-[-30px]">
        <Image
          src="/logo.png"
          alt=""
          width={360}
          height={360}
          className="opacity-[0.12] rotate-12"
          style={{ filter: 'brightness(2) grayscale(0.3)' }}
        />
      </div>

      {/* Card content */}
      <div className="relative h-full p-5 flex flex-col justify-between">
        {/* Top section - Name */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight">
              {memberData.name}
            </h1>
            <p className="text-xs opacity-90 mt-0.5">{memberData.club}</p>
          </div>
        </div>

        {/* QR Button */}
        <div className="flex justify-end relative z-10">
          <button
            onClick={onShowQR}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg font-bold border border-white/30 hover:bg-white/30 transition-all text-[10px]"
          >
            <span className="material-symbols-outlined text-lg">qr_code_2</span>
            VER QR
          </button>
        </div>

        {/* DNI and Birth date */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div>
            <p className="text-[8px] opacity-60 uppercase font-bold tracking-wider">DNI</p>
            <p className="text-xs font-semibold">{memberData.dni}</p>
          </div>
          <div>
            <p className="text-[8px] opacity-60 uppercase font-bold tracking-wider">Nacimiento</p>
            <p className="text-xs font-semibold">{memberData.birthDate}</p>
          </div>
        </div>

        {/* Separator and insurance validity */}
        <div className="pt-2 border-t border-white/20 flex items-center justify-between relative z-10">
          <div>
            <p className="text-[8px] opacity-60 uppercase font-bold tracking-wider">Vigencia del Seguro</p>
            <p className="text-xs font-semibold">{memberData.insuranceStart} - {memberData.insuranceEnd}</p>
          </div>
          {memberData.status === 'activo' ? (
            <span className="bg-green-500/20 backdrop-blur-md border border-green-400/30 text-green-300 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              PAGADO
            </span>
          ) : (
            <span className="bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-300 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              NO PAGADO
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function getEstado(cupon: CuponResponse): 'disponible' | 'usado' | 'vencido' {
  if (cupon.usado) return 'usado'
  if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < new Date(new Date().toDateString())) return 'vencido'
  return 'disponible'
}

// Componente del dashboard para jugador
function JugadorDashboard() {
  const { user } = useAuthStore()
  const [showQR, setShowQR] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dniRaw, setDniRaw] = useState('')
  const [cupones, setCupones] = useState<CuponResponse[]>([])
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
    loadData()
  }, [])

  const loadData = async () => {
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

      // Cupones en paralelo pero sin romper si falla
      getMisCupones().then(setCupones).catch(() => {})
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const cuponesDisponibles = cupones.filter(c => getEstado(c) === 'disponible')

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

  const quickActions = [
    { icon: 'confirmation_number', label: 'Mis Cupones', href: '/dashboard/jugador/cupones', highlighted: true },
    { icon: 'emoji_events', label: 'Torneos', href: '/dashboard/jugador/torneos', highlighted: false },
    { icon: 'qr_code_2', label: 'Mi QR', href: '#', highlighted: false, action: () => setShowQR(true) },
    { icon: 'person', label: 'Mi Perfil', href: '/dashboard/jugador/perfil', highlighted: false },
  ]

  return (
    <>
      <QRModal isOpen={showQR} onClose={() => setShowQR(false)} dni={dniRaw} />

      <div className="space-y-6">
        {/* Header - Saludo */}
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-primary/20">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">person</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Hola {memberData.name.split(' ')[0]}!
            </h1>
            {memberData.club && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{memberData.club}</p>
            )}
          </div>
        </div>

        {/* Credencial Digital - Tarjeta original */}
        <CredentialCard memberData={memberData} onShowQR={() => setShowQR(true)} />

        {/* Acciones Rapidas - Horizontal scroll estilo Carrefour */}
        <div className="flex gap-3 overflow-x-auto pt-3 pb-1 scrollbar-hide">
          {quickActions.map((action, idx) => {
            const content = (
              <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                <div
                  className={`relative size-[60px] rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                    action.highlighted
                      ? 'bg-white dark:bg-slate-800 border-2 border-primary/40 shadow-primary/10 shadow-md'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {action.highlighted && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[7px] font-bold px-2 py-[3px] rounded-full whitespace-nowrap leading-none">
                      Destacado
                    </span>
                  )}
                  <span className={`material-symbols-outlined text-[26px] ${action.highlighted ? 'text-primary' : 'text-primary'}`}>
                    {action.icon}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 text-center leading-tight max-w-[72px]">
                  {action.label}
                </span>
              </div>
            )

            if (action.action) {
              return (
                <button key={idx} onClick={action.action} className="shrink-0">
                  {content}
                </button>
              )
            }
            return (
              <Link key={idx} href={action.href} className="shrink-0">
                {content}
              </Link>
            )
          })}
        </div>

        {/* Solicitar Seguro */}
        <a
          href="https://wa.me/542996130664?text=Hola%2C%20quiero%20solicitar%20un%20seguro%20deportivo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/30 transition-colors active:scale-[0.99]"
        >
          <Image
            src="/logos/seguro.png"
            alt="Seguro Deportivo"
            width={40}
            height={40}
            className="size-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Solicitar un seguro</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Contactanos por WhatsApp</p>
          </div>
          <span className="material-symbols-outlined text-green-500 text-2xl">chat</span>
        </a>

        {/* Cupones Destacados */}
        {cuponesDisponibles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Cupones disponibles</h2>
              <Link href="/dashboard/jugador/cupones" className="text-xs font-semibold text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {cuponesDisponibles.slice(0, 4).map((cupon) => (
                <Link
                  key={cupon.id}
                  href="/dashboard/jugador/cupones"
                  className="min-w-[200px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:border-primary transition-colors"
                >
                  <p className="text-2xl font-bold text-primary">
                    {cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento.toLocaleString()}`}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 line-clamp-1">{cupon.titulo}</p>
                  {cupon.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{cupon.descripcion}</p>
                  )}
                  {cupon.fecha_vencimiento && (
                    <span className="inline-block mt-2 text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                      Vence {new Date(cupon.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
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
