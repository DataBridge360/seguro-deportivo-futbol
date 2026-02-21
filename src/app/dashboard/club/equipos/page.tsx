'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getEquipos } from '@/lib/api'
import type { Equipo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadEquipos()
  }, [])

  const loadEquipos = async () => {
    try {
      setLoading(true)
      const data = await getEquipos()
      setEquipos(data)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar equipos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestioná los equipos del club</p>
        </div>
        <Link
          href="/dashboard/club/equipos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo Equipo
        </Link>
      </div>

      {/* Grid de equipos */}
      {equipos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">groups</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay equipos creados</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primer equipo haciendo clic en "Nuevo Equipo"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipos.map((equipo) => (
            <div
              key={equipo.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4"
            >
              {/* Logo y nombre */}
              <div className="flex items-start gap-3">
                {equipo.logo_url ? (
                  <img src={equipo.logo_url} alt={equipo.nombre} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">shield</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{equipo.nombre}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    equipo.activo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Colores */}
              {(equipo.color_primario || equipo.color_secundario) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500">Colores:</span>
                  <div className="flex gap-1.5">
                    {equipo.color_primario && (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600" style={{ backgroundColor: equipo.color_primario }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{equipo.color_primario}</span>
                      </div>
                    )}
                    {equipo.color_secundario && (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600" style={{ backgroundColor: equipo.color_secundario }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{equipo.color_secundario}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Categorías */}
              {equipo.categorias && equipo.categorias.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Categorías</p>
                  <div className="flex flex-wrap gap-1.5">
                    {equipo.categorias.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón ver detalle */}
              <button
                onClick={() => setEquipoSeleccionado(equipo)}
                className="mt-auto px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Ver detalle
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {equipoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setEquipoSeleccionado(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado del modal */}
            <div className="flex items-start gap-3 mb-5">
              {equipoSeleccionado.logo_url ? (
                <img src={equipoSeleccionado.logo_url} alt={equipoSeleccionado.nombre} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-400">shield</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {equipoSeleccionado.nombre}
                </h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  equipoSeleccionado.activo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
                }`}>
                  {equipoSeleccionado.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Colores */}
            {(equipoSeleccionado.color_primario || equipoSeleccionado.color_secundario) && (
              <div className="mb-5">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                  Colores
                </p>
                <div className="flex gap-3">
                  {equipoSeleccionado.color_primario && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600" style={{ backgroundColor: equipoSeleccionado.color_primario }} />
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Primario</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{equipoSeleccionado.color_primario}</p>
                      </div>
                    </div>
                  )}
                  {equipoSeleccionado.color_secundario && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600" style={{ backgroundColor: equipoSeleccionado.color_secundario }} />
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Secundario</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{equipoSeleccionado.color_secundario}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Categorías */}
            {equipoSeleccionado.categorias && equipoSeleccionado.categorias.length > 0 && (
              <div className="mb-5">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                  Categorías ({equipoSeleccionado.categorias.length})
                </p>
                <div className="space-y-2">
                  {equipoSeleccionado.categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-start justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{cat.nombre}</p>
                        {cat.descripcion && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.descripcion}</p>
                        )}
                      </div>
                      {(cat.edad_minima || cat.edad_maxima) && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {cat.edad_minima && cat.edad_maxima ? `${cat.edad_minima}-${cat.edad_maxima} años` :
                           cat.edad_minima ? `${cat.edad_minima}+ años` :
                           cat.edad_maxima ? `Hasta ${cat.edad_maxima} años` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <button
              onClick={() => setEquipoSeleccionado(null)}
              className="w-full px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
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
