'use client'

export default function JugadorPartidosPage() {
  return (
    <>
      <div>
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-3 sm:mb-4 uppercase tracking-widest px-1">
          Próximos Eventos
        </p>

        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Próximo partido */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="material-symbols-outlined text-primary text-lg sm:text-xl">sports_soccer</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">Próximo partido</span>
            </div>

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="text-center flex-1">
                <div className="size-10 sm:size-12 rounded-full bg-primary/10 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg sm:text-xl">shield</span>
                </div>
                <p className="font-bold text-[#111518] dark:text-white text-xs sm:text-sm">Mi Equipo</p>
              </div>

              <div className="text-center px-2 sm:px-4">
                <p className="text-xl sm:text-2xl font-bold text-[#111518] dark:text-white">VS</p>
              </div>

              <div className="text-center flex-1">
                <div className="size-10 sm:size-12 rounded-full bg-slate-200 dark:bg-slate-700 mx-auto mb-1.5 sm:mb-2 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-lg sm:text-xl">shield</span>
                </div>
                <p className="font-bold text-[#111518] dark:text-white text-xs sm:text-sm">Rival FC</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-[#617989] dark:text-slate-400">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base sm:text-lg">calendar_month</span>
                <span>Sábado 15 Feb</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base sm:text-lg">schedule</span>
                <span>15:00</span>
              </div>
            </div>
          </div>

          {/* Entrenamiento */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="size-12 sm:size-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">fitness_center</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#111518] dark:text-white text-sm sm:text-base">Práctica de fútbol</p>
                <p className="text-[11px] sm:text-xs text-[#617989] dark:text-slate-400">Jueves 13 Feb · 18:00</p>
                <p className="text-[11px] sm:text-xs text-[#617989] dark:text-slate-400">Cancha de entrenamiento</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
