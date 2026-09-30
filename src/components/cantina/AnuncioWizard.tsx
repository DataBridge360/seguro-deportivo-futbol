'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SafeImage from '@/components/ui/SafeImage'
import { AnuncioResponse, crearAnuncio } from '@/lib/api'

const BANNER_WIDTH = 2048
const BANNER_HEIGHT = 640
const BANNER_ASPECT = BANNER_WIDTH / BANNER_HEIGHT

const STEPS = ['Imagen', 'Texto', 'Vigencia', 'Revisar']

const DURATION_CHIPS: { label: string; days: number }[] = [
  { label: '1 semana', days: 7 },
  { label: '2 semanas', days: 14 },
  { label: '1 mes', days: 30 },
]

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

function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toDateInputValue(date)
}

function formatLongDate(value: string): string {
  return new Date(value + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const inputBase =
  'w-full px-4 min-h-[44px] py-2.5 bg-white/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50'
const labelClass = 'block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide'
const cardClass =
  'relative bg-white/70 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl shadow-slate-200/40 dark:shadow-black/30'
const primaryBtn =
  'flex-1 min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2'
const secondaryBtn =
  'min-h-[48px] px-5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50'

interface AnuncioWizardProps {
  onCreated?: (anuncio: AnuncioResponse) => void
}

export default function AnuncioWizard({ onCreated }: AnuncioWizardProps) {
  const [step, setStep] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  const [cropOpen, setCropOpen] = useState(false)
  const [cropSource, setCropSource] = useState('')
  const [cropZoom, setCropZoom] = useState(1)
  const [cropX, setCropX] = useState(0)
  const [cropY, setCropY] = useState(0)
  const cropImageRef = useRef<HTMLImageElement | null>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const today = toDateInputValue(new Date())

  const stepValid = [
    !!imagen,
    titulo.trim().length > 0,
    fechaVencimiento.length > 0 && fechaVencimiento >= today,
    !!imagen && titulo.trim().length > 0 && fechaVencimiento.length > 0 && fechaVencimiento >= today,
  ]

  useEffect(() => {
    setMounted(true)
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
  }, [cropZoom, cropX, cropY, cropSource, cropOpen])

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
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT)
    ctx.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, BANNER_WIDTH, BANNER_HEIGHT)

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

    let type = 'image/webp'
    let ext = 'webp'
    let blob = await toBlob(type, 0.82)
    if (!blob || blob.type !== type) {
      type = 'image/jpeg'
      ext = 'jpg'
      blob = await toBlob(type, 0.85)
    }
    if (blob && blob.size > 1.5 * 1024 * 1024) {
      const smaller = await toBlob(type, 0.6)
      if (smaller) blob = smaller
    }
    if (!blob) return

    const file = new File([blob], `anuncio-${Date.now()}.${ext}`, { type: blob.type })
    setImagen(file)
    setCropOpen(false)
  }

  const reset = () => {
    setStep(0)
    setTitulo('')
    setDescripcion('')
    setFechaVencimiento('')
    setImagen(null)
    setPreview('')
    setError('')
  }

  const handlePublish = async () => {
    if (saving || !imagen || !titulo.trim() || !fechaVencimiento) return

    try {
      setSaving(true)
      setError('')
      const nuevo = await crearAnuncio({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagen,
        fecha_vencimiento: fechaVencimiento,
      })
      onCreated?.(nuevo)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el anuncio')
    } finally {
      setSaving(false)
    }
  }

  // ---------- Success ----------
  if (step === 4) {
    return (
      <div className={`${cardClass} text-center py-8`}>
        <div className="w-16 h-16 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Listo, publicado!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Los jugadores ya pueden ver el anuncio en su inicio.
        </p>
        <button type="button" onClick={reset} className={`${primaryBtn} w-full sm:w-auto sm:px-8 mx-auto mt-6`}>
          <span className="material-symbols-outlined text-lg">add</span>
          Publicar otro
        </button>
      </div>
    )
  }

  return (
    <div className={cardClass}>
      {/* Step indicator */}
      <div className="mb-6">
        <ol className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const done = i < step
            const current = i === step
            return (
              <li key={label} className="flex-1 min-w-0">
                <div className={`h-1.5 rounded-full transition-colors ${done || current ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <p className={`mt-1.5 text-xs font-semibold truncate ${current ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                  <span className="sm:hidden">{current ? `${i + 1}. ${label}` : i + 1}</span>
                  <span className="hidden sm:inline">{i + 1}. {label}</span>
                </p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Step 1: Image */}
      {step === 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Elegí la imagen</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sacá una foto o subí una imagen JPG, PNG o WebP. Se recorta en formato banner (2048 x 640 px).
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 w-full aspect-[3.2/1]">
            <SafeImage src={preview} alt="Vista previa" icon="image" iconClassName="text-4xl" className="h-full w-full object-cover" />
          </div>

          <label className="flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-semibold cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-xl">{imagen ? 'edit' : 'add_a_photo'}</span>
            {imagen ? 'Cambiar imagen' : 'Sacar foto o elegir imagen'}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </section>
      )}

      {/* Step 2: Text */}
      {step === 1 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contá de qué se trata</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Un título corto y, si querés, una descripción.</p>
          </div>

          <div>
            <label className={labelClass}>Título del anuncio</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Fiesta de fin de torneo"
              className={inputBase}
            />
          </div>

          <div>
            <label className={labelClass}>Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle del evento, horario, lugar o información importante."
              rows={5}
              className={`${inputBase} resize-none`}
            />
          </div>
        </section>
      )}

      {/* Step 3: Expiry */}
      {step === 2 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">¿Hasta cuándo se muestra?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Elegí una opción rápida o una fecha puntual.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {DURATION_CHIPS.map((chip) => {
              const value = addDays(chip.days)
              const active = fechaVencimiento === value
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setFechaVencimiento(value)}
                  aria-pressed={active}
                  className={`min-h-[44px] px-4 rounded-full border text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary/50'
                  }`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>

          <div>
            <label className={labelClass}>Fecha de vencimiento</label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              min={today}
              className={inputBase}
            />
          </div>
        </section>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revisá y publicá</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Así lo van a ver los jugadores en su inicio.</p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md">
            <SafeImage src={preview} alt={titulo} icon="campaign" className="w-full aspect-[3.2/1] object-cover" />
            <div className="p-4">
              <h3 className="font-bold text-slate-900 dark:text-white break-words">{titulo.trim()}</h3>
              {descripcion.trim() && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 break-words whitespace-pre-line line-clamp-4">
                  {descripcion.trim()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/30 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">event</span>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vence el</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {fechaVencimiento ? formatLongDate(fechaVencimiento) : '—'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[44px] px-3 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Editar
            </button>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/60 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="flex-1 break-words">{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || !stepValid[3]}
            className={`${primaryBtn} w-full min-h-[52px]`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">campaign</span>
                Publicar anuncio
              </>
            )}
          </button>
        </section>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} disabled={saving} className={secondaryBtn}>
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </button>
        )}
        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            disabled={!stepValid[step]}
            className={primaryBtn}
          >
            Siguiente
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        )}
      </div>

      {mounted && cropOpen && cropSource &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-xl max-h-full overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ajustar imagen</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Salida final: 2048 x 640 px</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCropOpen(false)}
                  aria-label="Cerrar"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <img ref={cropImageRef} src={cropSource} alt="" className="hidden" onLoad={drawCropPreview} />

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
                    className="w-full accent-primary min-h-[44px]"
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
                      className="w-full accent-primary min-h-[44px]"
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
                      className="w-full accent-primary min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button type="button" onClick={() => setCropOpen(false)} className={secondaryBtn}>
                  Cancelar
                </button>
                <button type="button" onClick={confirmCrop} className={`${primaryBtn} flex-none`}>
                  Usar recorte
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
