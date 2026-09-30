'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ImageCropperProps {
  file: File
  aspect?: number
  /** Exact output size in px; when both are set the MAX_SIDE rule is skipped */
  outputWidth?: number
  outputHeight?: number
  /** Max encoded size in bytes (default 2 MB) */
  maxBytes?: number
  /** Backdrop painted before drawing (default white) */
  fillBackground?: string
  onConfirm: (file: File, previewUrl: string) => void
  onCancel: () => void
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIDE = 800
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024
const MAX_ZOOM = 4

interface Loaded {
  file: File
  img: HTMLImageElement
  w: number
  h: number
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

async function encode(canvas: HTMLCanvasElement, maxBytes: number): Promise<{ blob: Blob; ext: string } | null> {
  let type = 'image/webp'
  let ext = 'webp'
  let quality = 0.82
  let blob = await toBlob(canvas, type, quality)
  if (!blob || blob.type !== type) {
    type = 'image/jpeg'
    ext = 'jpg'
    quality = 0.85
    blob = await toBlob(canvas, type, quality)
  }
  if (!blob) return null
  if (blob.size > maxBytes) {
    const smaller = await toBlob(canvas, type, 0.6)
    if (smaller) blob = smaller
  }
  if (blob.size > maxBytes) return null
  return { blob, ext }
}

export default function ImageCropper({
  file,
  aspect = 1,
  outputWidth,
  outputHeight,
  maxBytes = DEFAULT_MAX_BYTES,
  fillBackground = '#ffffff',
  onConfirm,
  onCancel,
}: ImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const prevFrameW = useRef(0)
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchDist = useRef(0)

  // Load results are keyed by file so a new file never shows the previous result
  const [loadedState, setLoaded] = useState<Loaded | null>(null)
  const [loadErrorState, setLoadError] = useState<{ file: File; message: string } | null>(null)
  const loaded = loadedState && loadedState.file === file ? loadedState : null
  const loadError = loadErrorState && loadErrorState.file === file ? loadErrorState.message : ''
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [frameW, setFrameW] = useState(280)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  const validType = ACCEPTED.includes(file.type)
  const frameH = frameW / aspect

  // Load the picked file as an image; state is only set from async callbacks
  useEffect(() => {
    if (!validType) return
    // StrictMode runs this effect twice: ignore results from the cancelled run
    let cancelled = false
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      setLoaded({ file, img, w: img.naturalWidth, h: img.naturalHeight })
      zoomRef.current = 1
      setZoom(1)
      setOffset({ x: 0, y: 0 })
      setError('')
    }
    img.onerror = () => {
      if (cancelled) return
      setLoadError({ file, message: 'No pudimos abrir esa imagen. Probá con otra.' })
    }
    img.src = url
    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [file, validType])

  // Size the frame from the real container width, capped by aspect and by ~55% of the viewport height
  useEffect(() => {
    if (!containerEl) return
    const update = () => {
      const cap = aspect > 1.2 ? 720 : 420
      const maxByHeight = window.innerHeight * 0.55 * aspect
      const next = Math.round(Math.max(120, Math.min(cap, containerEl.clientWidth, maxByHeight)))
      const prev = prevFrameW.current
      prevFrameW.current = next
      if (prev && prev !== next) {
        // Keep the same relative pan position when the on-screen size changes
        const ratio = next / prev
        setOffset(o => ({ x: o.x * ratio, y: o.y * ratio }))
      }
      setFrameW(next)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerEl)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [aspect, containerEl])

  // Scale at zoom 1 so the image just covers the frame
  const baseScale = loaded ? Math.max(frameW / loaded.w, frameH / loaded.h) : 1
  const scale = baseScale * zoom

  const zoomRef = useRef(1)

  const clampOffset = useCallback(
    (o: { x: number; y: number }, z: number) => {
      if (!loaded) return o
      const s = Math.max(frameW / loaded.w, frameH / loaded.h) * z
      const maxX = Math.max(0, (loaded.w * s - frameW) / 2)
      const maxY = Math.max(0, (loaded.h * s - frameH) / 2)
      return { x: Math.min(maxX, Math.max(-maxX, o.x)), y: Math.min(maxY, Math.max(-maxY, o.y)) }
    },
    [loaded, frameW, frameH]
  )

  const applyZoom = useCallback(
    (next: number) => {
      const z = Math.min(MAX_ZOOM, Math.max(1, next))
      // Keep the visible center stable while zooming
      const ratio = z / zoomRef.current
      zoomRef.current = z
      setZoom(z)
      setOffset(o => clampOffset({ x: o.x * ratio, y: o.y * ratio }, z))
    },
    [clampOffset]
  )

  // Native wheel listener so preventDefault works (React wheel is passive)
  const applyZoomRef = useRef(applyZoom)
  applyZoomRef.current = applyZoom
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoomRef.current(zoomRef.current * (e.deltaY < 0 ? 1.08 : 1 / 1.08))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [loaded])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const cur = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, cur)
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinchDist.current > 0) applyZoom(zoom * (dist / pinchDist.current))
      pinchDist.current = dist
      return
    }
    const dx = cur.x - prev.x
    const dy = cur.y - prev.y
    setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }, zoom))
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    pinchDist.current = 0
  }

  const handleConfirm = async () => {
    if (!loaded) return
    setWorking(true)
    setError('')
    try {
      // Visible area in source pixel coordinates
      const srcW = frameW / scale
      const srcH = frameH / scale
      const srcX = loaded.w / 2 - offset.x / scale - srcW / 2
      const srcY = loaded.h / 2 - offset.y / scale - srcH / 2

      let outW: number
      let outH: number
      if (outputWidth && outputHeight) {
        outW = Math.round(outputWidth)
        outH = Math.round(outputHeight)
      } else {
        const longSide = Math.max(srcW, srcH)
        const ratio = Math.min(1, MAX_SIDE / longSide)
        outW = Math.max(1, Math.round(srcW * ratio))
        outH = Math.max(1, Math.round(srcH * ratio))
      }

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')
      // White backdrop so transparent PNGs do not turn black when exported as JPEG
      ctx.fillStyle = fillBackground
      ctx.fillRect(0, 0, outW, outH)
      ctx.drawImage(loaded.img, srcX, srcY, srcW, srcH, 0, 0, outW, outH)

      const result = await encode(canvas, maxBytes)
      if (!result) {
        const limit = Number((maxBytes / (1024 * 1024)).toFixed(1))
        setError(`La imagen sigue pesando más de ${limit} MB. Probá con otra o hacele más zoom.`)
        return
      }
      const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
      const out = new File([result.blob], `${base}.${result.ext}`, { type: result.blob.type })
      onConfirm(out, URL.createObjectURL(out))
    } catch {
      setError('No pudimos procesar la imagen. Probá con otra.')
    } finally {
      setWorking(false)
    }
  }

  if (typeof document === 'undefined') return null

  const message = !validType ? 'Solo se aceptan imágenes JPG, PNG o WEBP.' : loadError

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Recortar imagen"
        className={`flex max-h-[92dvh] w-full ${aspect > 1.2 ? 'max-w-3xl' : 'max-w-md'} flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800`}
      >
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ajustá la imagen</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Arrastrá para ajustar · rueda o pellizco para zoom</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {message ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {message}
            </p>
          ) : !loaded ? (
            <div className="flex h-48 items-center justify-center text-slate-500">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            </div>
          ) : (
            <>
              <div ref={setContainerEl} className="flex w-full justify-center">
                <div
                  ref={frameRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  style={{ width: frameW, height: frameH, touchAction: 'none' }}
                  className="relative cursor-grab select-none overflow-hidden rounded-xl bg-slate-900 ring-2 ring-primary active:cursor-grabbing"
                >
                  <img
                    src={loaded.img.src}
                    alt=""
                    draggable={false}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: loaded.w * scale,
                      height: loaded.h * scale,
                      maxWidth: 'none',
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                      pointerEvents: 'none',
                    }}
                  />
                  <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/25" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Alejar"
                  onClick={() => applyZoom(zoom - 0.2)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <input
                  type="range"
                  min={1}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={e => applyZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="h-11 w-full accent-primary"
                />
                <button
                  type="button"
                  aria-label="Acercar"
                  onClick={() => applyZoom(zoom + 0.2)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="flex h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          {!message && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!loaded || working}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {working && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
              Usar imagen
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
