'use client'

import { useState } from 'react'
import { MOCK_PARTIDOS, MOCK_EVENTOS, formatDate } from '@/lib/mockData'

type CalendarItem = {
  id: string
  titulo: string
  fecha: string
  hora: string
  tipo: 'partido' | 'entrenamiento' | 'evento' | 'reunion'
  detalle: string
}

const tipoColors: Record<string, string> = {
  partido: 'bg-primary text-primary',
  entrenamiento: 'bg-green-500 text-green-500',
  evento: 'bg-amber-500 text-amber-500',
  reunion: 'bg-purple-500 text-purple-500',
}

const tipoBgColors: Record<string, string> = {
  partido: 'bg-primary/10',
  entrenamiento: 'bg-green-500/10',
  evento: 'bg-amber-500/10',
  reunion: 'bg-purple-500/10',
}

const tipoLabels: Record<string, string> = {
  partido: 'Partido',
  entrenamiento: 'Entrenamiento',
  evento: 'Evento',
  reunion: 'Reunion',
}

const tipoIcons: Record<string, string> = {
  partido: 'sports_soccer',
  entrenamiento: 'fitness_center',
  evento: 'celebration',
  reunion: 'groups',
}

export default function JugadorCalendarioPage() {
  const [filtro, setFiltro] = useState<string>('todos')

  // Combinar partidos y eventos
  const items: CalendarItem[] = [
    ...MOCK_PARTIDOS.map(p => ({
      id: `p-${p.id}`,
      titulo: `${p.equipoLocal} vs ${p.equipoVisitante}`,
      fecha: p.fecha,
      hora: p.hora,
      tipo: 'partido' as const,
      detalle: `${p.torneo} · ${p.ubicacion}`,
    })),
    ...MOCK_EVENTOS.map(e => ({
      id: `e-${e.id}`,
      titulo: e.titulo,
      fecha: e.fecha,
      hora: e.hora,
      tipo: e.tipo,
      detalle: e.descripcion,
    })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha))

  const filteredItems = filtro === 'todos' ? items : items.filter(i => i.tipo === filtro)

  // Agrupar por mes
  const grouped = filteredItems.reduce<Record<string, CalendarItem[]>>((acc, item) => {
    const date = new Date(item.fecha + 'T00:00:00')
    const key = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Calendario</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Partidos, entrenamientos y eventos
        </p>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-3">
        {['todos', 'partido', 'entrenamiento', 'evento', 'reunion'].map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltro(tipo)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === tipo
                ? tipo === 'todos'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : `${tipoBgColors[tipo]} ${tipoColors[tipo].split(' ')[1]}`
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tipo !== 'todos' && (
              <span className={`w-2 h-2 rounded-full ${tipoColors[tipo].split(' ')[0]}`} />
            )}
            {tipo === 'todos' ? 'Todos' : tipoLabels[tipo]}
          </button>
        ))}
      </div>

      {/* Items agrupados por mes */}
      {Object.entries(grouped).map(([month, monthItems]) => (
        <div key={month}>
          <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 capitalize">
            {month}
          </h2>
          <div className="flex flex-col gap-3">
            {monthItems.map((item) => {
              const date = new Date(item.fecha + 'T00:00:00')
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
                >
                  {/* Dot + fecha */}
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {date.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {date.getDate()}
                    </p>
                    <span className={`inline-block w-2 h-2 rounded-full mt-1 ${tipoColors[item.tipo].split(' ')[0]}`} />
                  </div>

                  <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`material-symbols-outlined text-lg ${tipoColors[item.tipo].split(' ')[1]}`}>
                        {tipoIcons[item.tipo]}
                      </span>
                      <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                        {item.titulo}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.hora} · {item.detalle}
                    </p>
                  </div>

                  <span className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${tipoBgColors[item.tipo]} ${tipoColors[item.tipo].split(' ')[1]}`}>
                    {tipoLabels[item.tipo]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">calendar_month</span>
          <p className="text-slate-500 dark:text-slate-400">No hay eventos para mostrar</p>
        </div>
      )}
    </div>
  )
}
