'use client'

import Link from 'next/link'

// Datos mock de equipos del usuario
const misEquipos = [
  {
    id: 'leones-fc',
    nombre: 'Leones FC',
    categoria: 'Sub 18',
    deporte: 'Fútbol Masculino',
    icon: 'sports_soccer',
    iconBg: 'bg-primary/5 dark:bg-primary/10',
    iconBorder: 'border-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'titanes-basquet',
    nombre: 'Titanes Básquet',
    categoria: '',
    deporte: 'Básquetbol Mixto',
    icon: 'sports_basketball',
    iconBg: 'bg-orange-50 dark:bg-orange-500/10',
    iconBorder: 'border-orange-100 dark:border-orange-500/20',
    iconColor: 'text-orange-500',
  },
  {
    id: 'club-tenis-elite',
    nombre: 'Club Tenis Elite',
    categoria: '',
    deporte: 'Tenis Individual',
    icon: 'sports_tennis',
    iconBg: 'bg-green-50 dark:bg-green-500/10',
    iconBorder: 'border-green-100 dark:border-green-500/20',
    iconColor: 'text-green-600 dark:text-green-500',
  },
]

// Cambiar a true/false para probar ambos estados
const tieneEquipos = misEquipos.length > 0

export default function EquipoPage() {
  if (!tieneEquipos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center">
        {/* Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150"></div>
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-white dark:bg-slate-800 shadow-xl">
            <span
              className="material-symbols-outlined text-primary text-7xl select-none"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
            >
              sports_soccer
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/20 border-4 border-background-light dark:border-background-dark">
            <span className="material-symbols-outlined text-orange-500 text-xl font-bold">priority_high</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white leading-tight mb-4">
          Todavía no tienes un equipo asignado
        </h1>

        {/* Description */}
        <p className="text-sm text-[#617989] dark:text-slate-400 leading-relaxed mb-10 max-w-[280px]">
          Para comenzar a ver tus estadísticas, entrenamientos y próximos partidos, necesitas unirte a un equipo del club.
        </p>

        {/* Join Team Button */}
        <Link
          href="/dashboard/jugador/equipo/unirse"
          className="flex w-full max-w-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 px-6 bg-primary text-white text-base font-bold shadow-lg shadow-primary/30 active:scale-[0.98] transition-all hover:brightness-110"
        >
          <span className="material-symbols-outlined mr-2">add_circle</span>
          <span className="truncate">Unirse a un equipo</span>
        </Link>

        {/* Support Link */}
        <Link
          href="#"
          className="mt-6 text-sm font-semibold text-primary/80 hover:text-primary transition-colors"
        >
          Contactar soporte
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Botón unirse a otro equipo */}
      <Link
        href="/dashboard/jugador/equipo/unirse"
        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 px-6 bg-primary/10 text-primary border border-primary/20 text-base font-bold active:scale-[0.98] transition-all hover:bg-primary/15"
      >
        <span className="material-symbols-outlined mr-2">add_circle</span>
        <span className="truncate">Unirse a otro equipo</span>
      </Link>

      {/* Lista de equipos */}
      <div className="flex flex-col gap-3">
        {misEquipos.map((equipo) => (
          <Link
            key={equipo.id}
            href={`/dashboard/jugador/equipo/${equipo.id}`}
            className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-[#e5e7eb] dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className={`flex-shrink-0 size-14 rounded-xl ${equipo.iconBg} flex items-center justify-center border ${equipo.iconBorder}`}>
              <span className={`material-symbols-outlined ${equipo.iconColor} text-3xl`}>{equipo.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#111518] dark:text-white text-base truncate">
                {equipo.nombre}{equipo.categoria && ` - ${equipo.categoria}`}
              </h3>
              <p className="text-sm text-[#617989] dark:text-slate-400 truncate">
                {equipo.deporte}
              </p>
            </div>
            <span className="material-symbols-outlined text-[#617989] flex-shrink-0">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Texto informativo */}
      <div className="mt-4 px-4 text-center">
        <p className="text-xs text-[#617989] dark:text-slate-400">
          Estás viendo los equipos donde eres miembro activo. Para gestionar tu suscripción, ve a la sección de perfil.
        </p>
      </div>
    </div>
  )
}
