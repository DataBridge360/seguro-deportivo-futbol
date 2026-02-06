'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MOCK_TORNEOS } from '@/lib/mockData'
import type { Torneo } from '@/lib/mockData'

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

function getEstadoLabel(estado: Torneo['estado']) {
  switch (estado) {
    case 'En curso':
      return 'En curso'
    case 'Proximo':
      return 'Proximo'
    case 'Finalizado':
      return 'Finalizado'
  }
}

export default function ClubTorneosPage() {
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Torneos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Torneos en los que participa tu club
          </p>
        </div>
        <Link
          href="/dashboard/club/torneos/nuevo"
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nuevo Torneo
        </Link>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_TORNEOS.map((torneo) => (
          <div
            key={torneo.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4"
          >
            {/* Nombre y estado */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {torneo.nombre}
              </h3>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneo.estado)}`}
              >
                {getEstadoLabel(torneo.estado)}
              </span>
            </div>

            {/* Fechas */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>
                {torneo.fechaInicio} - {torneo.fechaFin}
              </span>
            </div>

            {/* Equipos */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-lg text-slate-400 dark:text-slate-500">
                groups
              </span>
              {torneo.equipos.map((equipo) => (
                <span
                  key={equipo}
                  className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                >
                  {equipo}
                </span>
              ))}
            </div>

            {/* Boton ver detalle */}
            <div className="pt-2 mt-auto">
              <button
                onClick={() => setTorneoSeleccionado(torneo)}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors w-full"
              >
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalle */}
      {torneoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setTorneoSeleccionado(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {torneoSeleccionado.nombre}
              </h2>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getBadgeClasses(torneoSeleccionado.estado)}`}
              >
                {getEstadoLabel(torneoSeleccionado.estado)}
              </span>
            </div>

            {/* Fechas */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>
                {torneoSeleccionado.fechaInicio} - {torneoSeleccionado.fechaFin}
              </span>
            </div>

            {/* Equipos participantes */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Equipos participantes
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {torneoSeleccionado.equipos.map((equipo) => (
                  <span
                    key={equipo}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary"
                  >
                    {equipo}
                  </span>
                ))}
              </div>
            </div>

            {/* Descripcion */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Descripcion
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {torneoSeleccionado.descripcion}
              </p>
            </div>

            {/* Boton cerrar */}
            <button
              onClick={() => setTorneoSeleccionado(null)}
              className="w-full px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
