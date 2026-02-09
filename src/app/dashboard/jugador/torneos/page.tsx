'use client'

import { useState } from 'react'
import { MOCK_TORNEOS, MOCK_INSCRIPCIONES_TORNEO } from '@/lib/mockData'
import type { Torneo, InscripcionTorneo } from '@/lib/mockData'
import NotificationModal from '@/components/ui/NotificationModal'

function getBadgeClasses(estado: Torneo['estado']) {
  switch (estado) {
    case 'En curso':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'Proximo':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    case 'Finalizado':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
  }
}

export default function JugadorTorneosPage() {
  const [inscripciones, setInscripciones] = useState<InscripcionTorneo[]>(MOCK_INSCRIPCIONES_TORNEO.filter(i => i.jugadorId === '1'))
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })
  const [tab, setTab] = useState<'disponibles' | 'inscritos'>('disponibles')

  const torneosDisponibles = MOCK_TORNEOS.filter(t => t.inscripcionesAbiertas && !inscripciones.some(i => i.torneoId === t.id))
  const torneosInscritos = MOCK_TORNEOS.filter(t => inscripciones.some(i => i.torneoId === t.id))

  const handleInscribirse = (torneo: Torneo) => {
    const nuevaInscripcion: InscripcionTorneo = {
      id: String(Date.now()),
      torneoId: torneo.id,
      jugadorId: '1',
      equipo: 'River Plate',
      categoria: '+18',
      estado: 'pendiente',
      fechaInscripcion: new Date().toISOString().split('T')[0],
    }
    setInscripciones(prev => [...prev, nuevaInscripcion])
    setNotification({
      open: true,
      title: 'Inscripcion enviada',
      message: `Te inscribiste en ${torneo.nombre}. Tu inscripcion esta pendiente de confirmacion.`,
      type: 'success',
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Torneos</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Inscribite en torneos y consulta tus inscripciones
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => setTab('disponibles')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'disponibles'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Disponibles
        </button>
        <button
          onClick={() => setTab('inscritos')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'inscritos'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Mis Inscripciones ({inscripciones.length})
        </button>
      </div>

      {/* Torneos disponibles */}
      {tab === 'disponibles' && (
        <div className="flex flex-col gap-3">
          {torneosDisponibles.map((torneo) => (
            <div
              key={torneo.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}>
                  {torneo.estado}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>{torneo.fechaInicio} - {torneo.fechaFin}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{torneo.descripcion}</p>
              <button
                onClick={() => handleInscribirse(torneo)}
                className="w-full px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Inscribirme
              </button>
            </div>
          ))}

          {torneosDisponibles.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">emoji_events</span>
              <p className="text-slate-500 dark:text-slate-400">No hay torneos con inscripciones abiertas</p>
            </div>
          )}
        </div>
      )}

      {/* Mis inscripciones */}
      {tab === 'inscritos' && (
        <div className="flex flex-col gap-3">
          {torneosInscritos.map((torneo) => {
            const inscripcion = inscripciones.find(i => i.torneoId === torneo.id)!
            return (
              <div
                key={torneo.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{torneo.nombre}</h3>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}>
                    {torneo.estado}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  <span>{torneo.fechaInicio} - {torneo.fechaFin}</span>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">groups</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{inscripcion.equipo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">category</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{inscripcion.categoria}</span>
                  </div>
                  <span className={`ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                    inscripcion.estado === 'confirmada'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  }`}>
                    {inscripcion.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
              </div>
            )
          })}

          {torneosInscritos.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">emoji_events</span>
              <p className="text-slate-500 dark:text-slate-400">No estas inscrito en ningun torneo</p>
            </div>
          )}
        </div>
      )}

      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
