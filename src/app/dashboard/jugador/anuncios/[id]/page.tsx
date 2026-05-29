'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnuncioResponse, getAnuncio } from '@/lib/api'

export default function AnuncioDetallePage() {
  const params = useParams()
  const id = String(params.id)
  const [anuncio, setAnuncio] = useState<AnuncioResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAnuncio(id)
      .then(setAnuncio)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el anuncio'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !anuncio) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">campaign_off</span>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Anuncio no disponible</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error || 'No se encontro el anuncio.'}</p>
      </div>
    )
  }

  return (
    <article className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <img
          src={anuncio.imagen_url}
          alt={anuncio.titulo}
          className="w-full aspect-[16/9] object-cover"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">Anuncio</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{anuncio.titulo}</h1>
        {anuncio.descripcion && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mt-4">
            {anuncio.descripcion}
          </p>
        )}
      </div>
    </article>
  )
}
