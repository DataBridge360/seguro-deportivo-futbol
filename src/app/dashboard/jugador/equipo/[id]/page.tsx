'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import NotificationModal from '@/components/ui/NotificationModal'

// Datos mock de equipos
const equiposData: Record<string, {
  nombre: string
  categoria: string
  jugadores: { id: string; nombre: string; numero: number }[]
}> = {
  'leones-fc': {
    nombre: 'Leones FC',
    categoria: '+36',
    jugadores: [
      { id: '1', nombre: 'Mateo Fernández', numero: 10 },
      { id: '2', nombre: 'Santiago Rodríguez', numero: 1 },
      { id: '3', nombre: 'Julián Álvarez', numero: 4 },
      { id: '4', nombre: 'Bautista López', numero: 8 },
      { id: '5', nombre: 'Tomás García', numero: 14 },
      { id: '6', nombre: 'Lucas Martínez', numero: 7 },
      { id: '7', nombre: 'Facundo Sánchez', numero: 3 },
      { id: '8', nombre: 'Agustín Torres', numero: 11 },
      { id: '9', nombre: 'Nicolás Romero', numero: 6 },
      { id: '10', nombre: 'Joaquín Díaz', numero: 9 },
      { id: '11', nombre: 'Matías Ruiz', numero: 2 },
      { id: '12', nombre: 'Federico Gómez', numero: 5 },
      { id: '13', nombre: 'Ignacio Pérez', numero: 12 },
      { id: '14', nombre: 'Thiago Silva', numero: 13 },
      { id: '15', nombre: 'Valentín Castro', numero: 15 },
      { id: '16', nombre: 'Emiliano Morales', numero: 16 },
      { id: '17', nombre: 'Lautaro Herrera', numero: 17 },
      { id: '18', nombre: 'Maximiliano Flores', numero: 18 },
      { id: '19', nombre: 'Gonzalo Acosta', numero: 19 },
      { id: '20', nombre: 'Benjamín Núñez', numero: 20 },
      { id: '21', nombre: 'Ramiro Méndez', numero: 21 },
      { id: '22', nombre: 'Sebastián Vega', numero: 22 },
    ],
  },
  'titanes-basquet': {
    nombre: 'Titanes Básquet',
    categoria: '+23',
    jugadores: [
      { id: '1', nombre: 'Martín González', numero: 23 },
      { id: '2', nombre: 'Pablo Fernández', numero: 11 },
      { id: '3', nombre: 'Andrés López', numero: 5 },
      { id: '4', nombre: 'Diego Ramírez', numero: 7 },
      { id: '5', nombre: 'Carlos Medina', numero: 14 },
      { id: '6', nombre: 'Ricardo Blanco', numero: 32 },
      { id: '7', nombre: 'Fernando Paz', numero: 21 },
      { id: '8', nombre: 'Gabriel Luna', numero: 4 },
      { id: '9', nombre: 'Esteban Cruz', numero: 10 },
      { id: '10', nombre: 'Daniel Vargas', numero: 33 },
      { id: '11', nombre: 'María Rodríguez', numero: 15 },
      { id: '12', nombre: 'Laura Sánchez', numero: 8 },
    ],
  },
  'club-tenis-elite': {
    nombre: 'Club Tenis Elite',
    categoria: '+40',
    jugadores: [
      { id: '1', nombre: 'Alejandro Ruiz', numero: 1 },
      { id: '2', nombre: 'Victoria Méndez', numero: 2 },
      { id: '3', nombre: 'Roberto Silva', numero: 3 },
      { id: '4', nombre: 'Carolina Torres', numero: 4 },
      { id: '5', nombre: 'Emilio Castro', numero: 5 },
      { id: '6', nombre: 'Sofía Herrera', numero: 6 },
    ],
  },
}

export default function EquipoDetallePage() {
  const params = useParams()
  const router = useRouter()
  const equipoId = params.id as string
  const equipo = equiposData[equipoId]
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleSalirEquipo = () => {
    setShowConfirmModal(false)
    // Aquí iría la lógica para salir del equipo
    setShowSuccessModal(true)
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    router.push('/dashboard/jugador/equipo')
  }

  if (!equipo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center">
        <span className="material-symbols-outlined text-6xl text-[#617989] mb-4">error_outline</span>
        <h1 className="text-xl font-bold text-[#111518] dark:text-white mb-2">Equipo no encontrado</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mb-6">El equipo que buscas no existe o fue eliminado.</p>
        <Link
          href="/dashboard/jugador/equipo"
          className="text-primary font-semibold hover:underline"
        >
          Volver a mis equipos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      {/* Header del equipo */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Escudo */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-white dark:bg-slate-800 shadow-xl overflow-hidden border-4 border-white dark:border-slate-700">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
              <span className="material-symbols-outlined text-primary text-5xl md:text-6xl">shield</span>
            </div>
          </div>
        </div>

        {/* Nombre y categoría */}
        <h1 className="text-2xl md:text-3xl font-bold text-[#111518] dark:text-white mb-2">{equipo.nombre}</h1>
        <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
          {equipo.categoria}
        </div>
      </div>

      {/* Contador de jugadores */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 px-6 py-3 rounded-2xl text-center">
          <p className="text-[10px] text-[#617989] dark:text-slate-400 uppercase font-bold mb-1">Jugadores</p>
          <p className="text-2xl font-bold text-primary">{equipo.jugadores.length}</p>
        </div>
      </div>

      {/* Lista de jugadores */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#111518] dark:text-white">Plantel</h3>
        </div>

        <div className="flex flex-col gap-2">
          {equipo.jugadores.map((jugador) => (
            <div
              key={jugador.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-xl">apparel</span>
                </div>
                <p className="text-sm font-bold text-[#111518] dark:text-white">{jugador.nombre}</p>
              </div>
              <span className="text-sm font-bold text-primary">#{jugador.numero}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Botón salir del equipo */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowConfirmModal(true)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl h-12 px-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm font-semibold transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Salir del equipo
        </button>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-black/20 border border-white/20 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/10 p-4 rounded-full">
                <span className="material-symbols-outlined text-4xl text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
              </div>
            </div>
            <h2 className="text-[#111518] dark:text-white text-xl font-bold text-center mb-2">
              ¿Salir del equipo?
            </h2>
            <p className="text-[#617989] dark:text-slate-400 text-sm text-center mb-6 leading-relaxed">
              Estás por salir de <strong>{equipo.nombre}</strong>. Podrás volver a unirte en cualquier momento.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSalirEquipo}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
              >
                Sí, salir del equipo
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-[#111518] dark:text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        type="success"
        title="Has salido del equipo"
        message={`Ya no formas parte de ${equipo.nombre}.`}
        confirmText="Entendido"
      />
    </div>
  )
}
