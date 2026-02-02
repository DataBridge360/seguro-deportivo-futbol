'use client'

export default function JugadorBeneficiosPage() {
  const beneficios = [
    { id: 1, title: '20% OFF en Indumentaria', store: 'SportShop', expires: '31/03/2025', icon: 'checkroom' },
    { id: 2, title: '15% OFF en Suplementos', store: 'NutriStore', expires: '15/04/2025', icon: 'nutrition' },
    { id: 3, title: '2x1 en Bebidas', store: 'HidraMax', expires: '28/02/2025', icon: 'water_drop' },
  ]

  return (
    <>
      <div>
        <p className="text-[11px] font-bold text-[#617989] dark:text-slate-400 mb-3 sm:mb-4 uppercase tracking-widest px-1">
          Mis Beneficios
        </p>

        <div className="flex flex-col gap-3 sm:gap-4">
          {beneficios.map((beneficio) => (
            <div
              key={beneficio.id}
              className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-transparent"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="size-12 sm:size-14 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">{beneficio.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#111518] dark:text-white text-sm sm:text-base">{beneficio.title}</p>
                  <p className="text-[11px] sm:text-xs text-[#617989] dark:text-slate-400">{beneficio.store}</p>
                  <p className="text-[10px] text-[#617989] dark:text-slate-400 mt-1">
                    Vence: {beneficio.expires}
                  </p>
                </div>
              </div>
              <button className="mt-3 sm:mt-4 w-full bg-primary/10 text-primary font-bold py-2.5 sm:py-3 rounded-xl hover:bg-primary/20 transition-colors text-sm sm:text-base">
                Usar cupón
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
