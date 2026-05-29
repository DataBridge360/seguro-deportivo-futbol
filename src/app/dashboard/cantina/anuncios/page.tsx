'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnuncioResponse, crearAnuncio, eliminarAnuncio, getAnunciosCantina } from '@/lib/api'

const BANNER_WIDTH = 2048
const BANNER_HEIGHT = 640
const BANNER_ASPECT = BANNER_WIDTH / BANNER_HEIGHT

function getCropRect(image: HTMLImageElement, zoom: number, positionX: number, positionY: number) {
  const imageWidth = image.naturalWidth
  const imageHeight = image.naturalHeight
  const imageAspect = imageWidth / imageHeight
  const baseWidth = imageAspect > BANNER_ASPECT ? imageHeight * BANNER_ASPECT : imageWidth
  const baseHeight = imageAspect > BANNER_ASPECT ? imageHeight : imageWidth / BANNER_ASPECT
  const cropWidth = baseWidth / zoom
  const cropHeight = baseHeight / zoom
  const maxOffsetX = Math.max(0, (imageWidth - cropWidth) / 2)
  const maxOffsetY = Math.max(0, (imageHeight - cropHeight) / 2)
  const centerX = imageWidth / 2 + (positionX / 100) * maxOffsetX
  const centerY = imageHeight / 2 + (positionY / 100) * maxOffsetY
  const sourceX = Math.min(Math.max(0, centerX - cropWidth / 2), imageWidth - cropWidth)
  const sourceY = Math.min(Math.max(0, centerY - cropHeight / 2), imageHeight - cropHeight)

  return { sourceX, sourceY, cropWidth, cropHeight }
}

export default function CantinaAnunciosPage() {
  const [anuncios, setAnuncios] = useState<AnuncioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [cropZoom, setCropZoom] = useState(1)
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const canSubmit = titulo.trim().length > 0 && fechaVencimiento.length > 0 && !!imagen && !saving

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

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource)
    }
  }, [cropSource])

  const drawCropPreview = () => {
    const image = cropImageRef.current
    const canvas = cropCanvasRef.current
    if (!image || !canvas || !image.naturalWidth) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { sourceX, sourceY, cropWidth, cropHeight } = getCropRect(image, cropZoom, cropX, cropY)
    canvas.width = BANNER_WIDTH
    canvas.height = BANNER_HEIGHT
    ctx.clearRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT)
    ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, BANNER_WIDTH, BANNER_HEIGHT)
  }

  useEffect(() => {
    drawCropPreview()
  }, [cropZoom, cropX, cropY, cropSource])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setError('')
    event.target.value = ''
    if (!file) return

    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(URL.createObjectURL(file))
    setCropZoom(1)
    setCropX(0)
    setCropY(0)
    setCropOpen(true)
  }

  const confirmCrop = async () => {
    const image = cropImageRef.current
    if (!image || !image.naturalWidth) return

    const canvas = document.createElement('canvas')
    canvas.width = BANNER_WIDTH
    canvas.height = BANNER_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { sourceX, sourceY, cropWidth, cropHeight } = getCropRect(image, cropZoom, cropX, cropY)
    ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, BANNER_WIDTH, BANNER_HEIGHT)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) return

    const file = new File([blob], `anuncio-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setImagen(file)
    setCropOpen(false)
  }

  const resetForm = () => {
    setTitulo('')
    setDescripcion('')
    setFechaVencimiento('')
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
        fecha_vencimiento: fechaVencimiento,
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
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
            Resolucion recomendada: <span className="font-semibold text-slate-900 dark:text-white">2048 x 640 px</span>.
            La imagen se recorta automaticamente a formato banner 3.2:1.
          </div>

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
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Fecha de vencimiento</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
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

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 w-[220px] h-[69px] sm:w-[260px] sm:h-[81px]">
            {preview ? (
              <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-xl">image</span>
                <span className="text-[11px] font-medium">Vista previa</span>
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

      {cropOpen && cropSource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ajustar imagen</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Salida final: 2048 x 640 px</p>
              </div>
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <img
              ref={cropImageRef}
              src={cropSource}
              alt=""
              className="hidden"
              onLoad={drawCropPreview}
            />

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
              <canvas ref={cropCanvasRef} className="block w-full aspect-[3.2/1]" />
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Zoom</label>
                  <span className="text-xs text-slate-400">{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Mover horizontal</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropX}
                    onChange={(e) => setCropX(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Mover vertical</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropY}
                    onChange={(e) => setCropY(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCrop}
                className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Usar recorte
              </button>
            </div>
          </div>
        </div>
      )}

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
                <img src={anuncio.imagen_url} alt={anuncio.titulo} className="w-full h-[69px] sm:h-[81px] object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{anuncio.titulo}</h3>
                  {anuncio.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">{anuncio.descripcion}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300">
                      Vence {new Date(anuncio.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
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
