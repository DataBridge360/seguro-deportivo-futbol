'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { AnuncioResponse, crearAnuncio, eliminarAnuncio, getAnunciosCantina } from '@/lib/api'

export default function CantinaAnunciosPage() {
  const [anuncios, setAnuncios] = useState<AnuncioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [preview, setPreview] = useState('')

  const canSubmit = titulo.trim().length > 0 && !!imagen && !saving

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

  useEffect(() => {
    if (!imagen) {
      setPreview('')
      return
    }
    const url = URL.createObjectURL(imagen)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imagen])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setImagen(file)
    setError('')
  }

  const resetForm = () => {
    setTitulo('')
    setDescripcion('')
    setImagen(null)
    setPreview('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!imagen || !titulo.trim()) return

    try {
      setSaving(true)
      setError('')
      const nuevo = await crearAnuncio({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagen,
      })
      setAnuncios((prev) => [nuevo, ...prev])
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el anuncio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Eliminar este anuncio?')
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
          Carga anuncios para que los jugadores los vean en su inicio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
          <div className="space-y-4">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Titulo del anuncio</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Fiesta de fin de torneo"
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Descripcion</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle del evento, horario, lugar o informacion importante."
                rows={5}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Imagen</label>
              <label className="flex items-center gap-3 px-3 py-3 bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                  {imagen ? imagen.name : 'Seleccionar imagen JPG, PNG o WebP'}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 aspect-[1.6/1] lg:aspect-auto lg:min-h-[17rem]">
            {preview ? (
              <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full min-h-[13rem] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-2">image</span>
                <span className="text-xs font-medium">Vista previa</span>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
            ) : (
              <><span className="material-symbols-outlined text-lg">campaign</span> Publicar anuncio</>
            )}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publicados</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedAnuncios.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">campaign</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Todavia no hay anuncios</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedAnuncios.map((anuncio) => (
              <div key={anuncio.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <img src={anuncio.imagen_url} alt={anuncio.titulo} className="w-full aspect-[1.6/1] object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{anuncio.titulo}</h3>
                  {anuncio.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{anuncio.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
                      Activo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(anuncio.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
