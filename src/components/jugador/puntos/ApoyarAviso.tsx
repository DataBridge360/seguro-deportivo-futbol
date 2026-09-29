import Link from 'next/link'

// Slim one-row notice that leads to the team support classification screen
export default function ApoyarAviso() {
  return (
    <Link
      href="/dashboard/jugador/puntos/equipos"
      className="flex min-h-14 items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 transition-opacity active:opacity-70 dark:border-rose-500/20 dark:bg-rose-500/10"
    >
      <span className="material-symbols-outlined text-2xl text-rose-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
        favorite
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-slate-900 dark:text-white">¡Apoyá a tu equipo!</span>
        <span className="block text-sm text-slate-600 dark:text-slate-300">Regalale puntos y ayudalo a ganar premios del club</span>
      </span>
      <span className="material-symbols-outlined text-slate-400" aria-hidden>
        chevron_right
      </span>
    </Link>
  )
}
