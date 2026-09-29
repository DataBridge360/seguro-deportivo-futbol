import Link from 'next/link'

// Slim one-row notice that leads to the team support classification screen
export default function ApoyarAviso() {
  return (
    <Link
      href="/dashboard/jugador/puntos/equipos"
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-transform active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/10">
          <span
            className="material-symbols-outlined text-xl text-rose-500"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            favorite
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-slate-900 dark:text-white">¡Apoyá a tu equipo!</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            Dale puntos en forma de apoyo y ayudalo a ganar premios del club
          </span>
        </span>
      </span>
      <span className="material-symbols-outlined shrink-0 text-slate-400" aria-hidden>
        chevron_right
      </span>
    </Link>
  )
}
