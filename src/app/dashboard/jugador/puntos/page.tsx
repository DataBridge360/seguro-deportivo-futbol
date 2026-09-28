export default function PuntosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Puntos</h1>

      <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-6 py-10">
        <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-sky-300/30 dark:from-primary/30 dark:to-sky-300/20">
          <span
            className="material-symbols-outlined text-primary dark:text-sky-300"
            style={{ fontSize: 56, fontVariationSettings: "'FILL' 1" }}
          >
            stars
          </span>
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Próximamente</h2>
        <p className="mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Vas a sumar puntos jugando y participando en el complejo, y podrás canjearlos por premios y descuentos.
        </p>
        <span className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20 dark:text-sky-300">
          En desarrollo
        </span>
      </div>
    </div>
  )
}
