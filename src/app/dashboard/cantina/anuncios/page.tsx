'use client'

import { useEffect, useMemo, useState } from 'react'
import SafeImage from '@/components/ui/SafeImage'
import AnuncioWizard from '@/components/cantina/AnuncioWizard'
import { AnuncioResponse, eliminarAnuncio, getAnunciosCantina } from '@/lib/api'

export default function CantinaAnunciosPage() {
  const [anuncios, setAnuncios] = useState<AnuncioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sortedAnuncios = useMemo(
    () => anuncios.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [anuncios]
  )

  const fetchAnuncios = async () => {
    try {
      setError('')
      const data = await getAnunciosCantina()
      setAnuncios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los anuncios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnuncios()
  }, [])

  const handleDelete = async (id: string) => {
    const ok = window.confirm('¿Eliminar este anuncio?')
    if (!ok) return

    try {
      await eliminarAnuncio(id)
      setAnuncios((prev) => prev.filter((anuncio) => anuncio.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el anuncio')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Anuncios</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Publicá anuncios para que los jugadores los vean en su inicio.
        </p>
      </div>

      <AnuncioWizard onCreated={(nuevo) => setAnuncios((prev) => [nuevo, ...prev])} />

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publicados</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedAnuncios.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">campaign</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Todavía no hay anuncios</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedAnuncios.map((anuncio) => (
              <div key={anuncio.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <SafeImage
                  src={anuncio.imagen_url}
                  alt={anuncio.titulo}
                  icon="campaign"
                  className="w-full aspect-[3.2/1] object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{anuncio.titulo}</h3>
                  {anuncio.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{anuncio.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300">
                      Vence {new Date(anuncio.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(anuncio.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      aria-label="Eliminar anuncio"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
