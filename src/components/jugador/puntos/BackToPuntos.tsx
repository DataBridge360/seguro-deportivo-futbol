import Link from 'next/link'

export default function BackToPuntos() {
  return (
    <Link
      href="/dashboard/jugador/puntos"
      className="inline-flex min-h-11 items-center gap-1 text-base font-semibold text-primary hover:underline dark:text-sky-300"
    >
      <span className="material-symbols-outlined" aria-hidden>
        arrow_back
      </span>
      Volver a Puntos
    </Link>
  )
}
