'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import NotificationModal from '@/components/ui/NotificationModal'

// Datos mock de categorías
const categorias = [
  { id: 'primera', nombre: 'Primera División' },
  { id: 'reserva', nombre: 'Reserva' },
  { id: 'sub20', nombre: 'Sub-20' },
  { id: 'sub17', nombre: 'Sub-17' },
  { id: 'sub15', nombre: 'Sub-15' },
  { id: 'sub13', nombre: 'Sub-13' },
  { id: 'femenino-a', nombre: 'Femenino A' },
  { id: 'femenino-b', nombre: 'Femenino B' },
]

// Datos mock de equipos
const equipos = [
  { id: 'atletico-plaza', nombre: 'Atlético Plaza Huincul', categoria: 'primera' },
  { id: 'atletico-plaza-b', nombre: 'Atlético Plaza Huincul B', categoria: 'reserva' },
  { id: 'deportivo-cutral', nombre: 'Deportivo Cutral Có', categoria: 'primera' },
  { id: 'deportivo-cutral-b', nombre: 'Deportivo Cutral Có B', categoria: 'reserva' },
  { id: 'union-neuquen', nombre: 'Unión de Neuquén', categoria: 'primera' },
  { id: 'union-neuquen-sub20', nombre: 'Unión de Neuquén', categoria: 'sub20' },
  { id: 'racing-norte', nombre: 'Racing del Norte', categoria: 'primera' },
  { id: 'racing-norte-sub17', nombre: 'Racing del Norte', categoria: 'sub17' },
  { id: 'san-martin', nombre: 'San Martín FC', categoria: 'primera' },
  { id: 'san-martin-reserva', nombre: 'San Martín FC', categoria: 'reserva' },
  { id: 'independiente-nqn', nombre: 'Independiente de Neuquén', categoria: 'primera' },
  { id: 'independiente-sub20', nombre: 'Independiente de Neuquén', categoria: 'sub20' },
  { id: 'rincon-fc', nombre: 'Rincón FC', categoria: 'sub17' },
  { id: 'rincon-sub15', nombre: 'Rincón FC', categoria: 'sub15' },
  { id: 'centenario-fc', nombre: 'Centenario FC', categoria: 'primera' },
  { id: 'centenario-sub13', nombre: 'Centenario FC', categoria: 'sub13' },
  { id: 'cipolletti', nombre: 'Club Cipolletti', categoria: 'primera' },
  { id: 'cipolletti-reserva', nombre: 'Club Cipolletti', categoria: 'reserva' },
  { id: 'alianza-fem', nombre: 'Alianza Femenino', categoria: 'femenino-a' },
  { id: 'las-leonas', nombre: 'Las Leonas FC', categoria: 'femenino-a' },
  { id: 'estrella-sur-fem', nombre: 'Estrella del Sur', categoria: 'femenino-b' },
  { id: 'victoria-fem', nombre: 'Club Victoria Femenino', categoria: 'femenino-b' },
  { id: 'petrolero-sub15', nombre: 'Club Petrolero', categoria: 'sub15' },
  { id: 'petrolero-sub13', nombre: 'Club Petrolero', categoria: 'sub13' },
]

export default function UnirseEquipoPage() {
  const router = useRouter()
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
  const [busquedaEquipo, setBusquedaEquipo] = useState('')
  const [dropdownEquipoAbierto, setDropdownEquipoAbierto] = useState(false)
  const [dropdownCategoriaAbierto, setDropdownCategoriaAbierto] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const dropdownEquipoRef = useRef<HTMLDivElement>(null)
  const dropdownCategoriaRef = useRef<HTMLDivElement>(null)

  // Filtrar equipos por categoría y búsqueda
  const equiposFiltrados = equipos.filter(equipo => {
    const coincideCategoria = !categoriaSeleccionada || equipo.categoria === categoriaSeleccionada
    const coincideBusqueda = equipo.nombre.toLowerCase().includes(busquedaEquipo.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownEquipoRef.current && !dropdownEquipoRef.current.contains(event.target as Node)) {
        setDropdownEquipoAbierto(false)
      }
      if (dropdownCategoriaRef.current && !dropdownCategoriaRef.current.contains(event.target as Node)) {
        setDropdownCategoriaAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSeleccionarEquipo = (equipo: typeof equipos[0]) => {
    setEquipoSeleccionado(equipo.id)
    setBusquedaEquipo(equipo.nombre)
    setDropdownEquipoAbierto(false)
  }

  const handleSeleccionarCategoria = (categoria: typeof categorias[0]) => {
    setCategoriaSeleccionada(categoria.id)
    setDropdownCategoriaAbierto(false)
    // Limpiar equipo si cambia la categoría
    setEquipoSeleccionado('')
    setBusquedaEquipo('')
  }

  const handleConfirmar = () => {
    if (categoriaSeleccionada && equipoSeleccionado) {
      // Aquí iría la lógica para guardar la selección
      setShowModal(true)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    router.push('/dashboard/jugador/equipo')
  }

  const puedeConfirmar = categoriaSeleccionada && equipoSeleccionado
  const categoriaNombre = categorias.find(c => c.id === categoriaSeleccionada)?.nombre

  return (
    <div className="flex flex-col min-h-[60vh] max-w-md mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-4xl text-primary">sports_soccer</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Selecciona tu equipo</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-2 px-4 leading-relaxed max-w-[300px]">
          Configura tu perfil seleccionando la categoría y el equipo correspondiente.
        </p>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Selector de Categoría - Dropdown personalizado */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-[#617989] dark:text-slate-400 uppercase tracking-widest px-1">
            Categoría
          </label>
          <div className="relative" ref={dropdownCategoriaRef}>
            <button
              type="button"
              onClick={() => setDropdownCategoriaAbierto(!dropdownCategoriaAbierto)}
              className="w-full rounded-2xl h-14 px-5 pr-12 text-left text-base font-medium bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:outline-none transition-all cursor-pointer text-[#111518] dark:text-white"
            >
              {categoriaNombre || (
                <span className="text-[#617989] dark:text-slate-400">Selecciona Categoría</span>
              )}
            </button>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
              <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: dropdownCategoriaAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                expand_more
              </span>
            </div>

            {/* Dropdown de categorías */}
            {dropdownCategoriaAbierto && (
              <div className="absolute z-50 w-full mt-2 rounded-2xl bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 shadow-xl shadow-black/10 overflow-hidden max-h-60 overflow-y-auto animate-[scaleIn_0.15s_ease-out]">
                {categorias.map((categoria) => (
                  <button
                    key={categoria.id}
                    onClick={() => handleSeleccionarCategoria(categoria)}
                    className={`w-full px-5 py-3.5 text-left hover:bg-primary/10 transition-colors flex items-center justify-between ${
                      categoriaSeleccionada === categoria.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <span className="font-medium text-[#111518] dark:text-white">{categoria.nombre}</span>
                    {categoriaSeleccionada === categoria.id && (
                      <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selector de Equipo con búsqueda */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-[#617989] dark:text-slate-400 uppercase tracking-widest px-1">
            Nombre del equipo
          </label>
          <div className="relative" ref={dropdownEquipoRef}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#617989] dark:text-slate-400">
                <span className="material-symbols-outlined text-xl">search</span>
              </span>
              <input
                type="text"
                value={busquedaEquipo}
                onChange={(e) => {
                  setBusquedaEquipo(e.target.value)
                  setEquipoSeleccionado('')
                  setDropdownEquipoAbierto(true)
                }}
                onFocus={() => setDropdownEquipoAbierto(true)}
                placeholder="Buscar equipo..."
                className="w-full rounded-2xl h-14 pl-12 pr-12 text-base font-medium bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:outline-none transition-all placeholder:text-[#617989] dark:placeholder:text-slate-400 text-[#111518] dark:text-white"
              />
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: dropdownEquipoAbierto ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              </div>
            </div>

            {/* Dropdown de resultados */}
            {dropdownEquipoAbierto && (
              <div className="absolute z-50 w-full mt-2 rounded-2xl bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 shadow-xl shadow-black/10 overflow-hidden max-h-60 overflow-y-auto animate-[scaleIn_0.15s_ease-out]">
                {equiposFiltrados.length > 0 ? (
                  equiposFiltrados.map((equipo) => {
                    const categoria = categorias.find(c => c.id === equipo.categoria)
                    return (
                      <button
                        key={equipo.id}
                        onClick={() => handleSeleccionarEquipo(equipo)}
                        className={`w-full px-5 py-3.5 text-left hover:bg-primary/10 transition-colors flex items-center justify-between ${
                          equipoSeleccionado === equipo.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-[#111518] dark:text-white">{equipo.nombre}</p>
                          <p className="text-xs text-[#617989] dark:text-slate-400">{categoria?.nombre}</p>
                        </div>
                        {equipoSeleccionado === equipo.id && (
                          <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                        )}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-5 py-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-[#617989]/30 dark:text-slate-500/30 mb-2 block">search_off</span>
                    <p className="text-sm text-[#617989] dark:text-slate-400">No se encontraron equipos</p>
                    {categoriaSeleccionada && (
                      <p className="text-xs text-[#617989]/60 dark:text-slate-500 mt-1">Intenta con otra categoría</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botón Confirmar */}
        <div className="pt-4">
          <button
            onClick={handleConfirmar}
            disabled={!puedeConfirmar}
            className={`flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-14 px-4 text-base font-bold shadow-lg transition-all active:scale-[0.98] ${
              puedeConfirmar
                ? 'bg-primary text-white shadow-primary/30 hover:brightness-110'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span className="truncate">Confirmar Selección</span>
          </button>
        </div>
      </div>

      {/* Footer de soporte */}
      <p className="mt-6 pt-6 text-center text-xs text-[#617989] dark:text-slate-500 font-medium border-t border-slate-200 dark:border-slate-700">
        ¿No encuentras tu equipo?{' '}
        <Link href="#" className="text-primary font-bold hover:underline">
          Contactar Soporte
        </Link>
      </p>

      {/* Modal de confirmación */}
      <NotificationModal
        isOpen={showModal}
        onClose={handleModalClose}
        type="success"
        title="¡Equipo seleccionado!"
        message={`Te has unido a ${busquedaEquipo} en la categoría ${categorias.find(c => c.id === categoriaSeleccionada)?.nombre}.`}
        confirmText="Continuar"
      />

      <style jsx>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
