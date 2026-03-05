'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { verificarJugadorDNI, type VerificacionJugador } from '@/lib/api'
import jsQR from 'jsqr'

type Resultado = VerificacionJugador & { dni: string }

export default function VerificarQRPage() {
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState('')

  // Scanner
  const [scannerActive, setScannerActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const scanningRef = useRef(false)

  const stopScanner = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScannerActive(false)
    scanningRef.current = false
  }, [])

  const startScanner = useCallback(async () => {
    try {
      setError('')
      setResultado(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScannerActive(true)
      scanningRef.current = true
    } catch {
      setError('No se pudo acceder a la cámara.')
    }
  }, [])

  useEffect(() => {
    if (!scannerActive || !videoRef.current) return
    const video = videoRef.current

    const scan = async () => {
      if (!scanningRef.current) return
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan)
        return
      }
      try {
        let scannedValue: string | null = null
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(video)
          if (codes.length > 0) scannedValue = (codes[0].rawValue as string).trim()
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          canvas.getContext('2d')!.drawImage(video, 0, 0)
          const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(imageData.data, imageData.width, imageData.height)
          if (result) scannedValue = result.data.trim()
        }
        if (scannedValue !== null) {
          stopScanner()
          setDni(scannedValue)
          await buscar(scannedValue)
          return
        }
      } catch { /* ignore */ }
      animFrameRef.current = requestAnimationFrame(scan)
    }

    animFrameRef.current = requestAnimationFrame(scan)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [scannerActive, stopScanner])

  useEffect(() => () => stopScanner(), [stopScanner])

  const buscar = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) { setError('Ingresá un DNI'); return }
    setError('')
    setResultado(null)
    setLoading(true)
    try {
      const data = await verificarJugadorDNI(trimmed)
      setResultado({ ...data, dni: trimmed })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    buscar(dni)
  }

  const handleNueva = () => {
    setResultado(null)
    setDni('')
    setError('')
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificar jugador</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Escaneá el QR del carnet o ingresá el DNI</p>
      </div>

      {/* Scanner area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {scannerActive ? (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full aspect-square object-cover"
              muted
              playsInline
            />
            {/* Targeting overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-xl opacity-80">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
            <button
              onClick={stopScanner}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-xs font-medium drop-shadow">
              Apuntá al QR del carnet
            </p>
          </div>
        ) : (
          <button
            onClick={startScanner}
            className="w-full flex flex-col items-center justify-center gap-3 py-10 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <span className="material-symbols-outlined text-5xl">qr_code_scanner</span>
            <span className="text-sm font-medium">Escanear QR del carnet</span>
          </button>
        )}
      </div>

      {/* Manual input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">DNI del jugador</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={dni}
              onChange={e => { setDni(e.target.value); setError(''); setResultado(null) }}
              placeholder="Ej: 38123456"
              className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={loading || !dni.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">search</span>}
              Buscar
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
          <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result card */}
      {resultado && (
        <div className={`rounded-xl border-2 overflow-hidden ${resultado.encontrado ? 'border-slate-200 dark:border-slate-700' : 'border-red-200 dark:border-red-500/30'}`}>
          {resultado.encontrado ? (
            <>
              {/* Header */}
              <div className="px-4 py-4 bg-white dark:bg-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {resultado.apellido}, {resultado.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {resultado.dni}</p>
                </div>
              </div>

              {/* Status rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-slate-400">how_to_reg</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Registrado</span>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${resultado.activo ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {resultado.activo ? 'check_circle' : 'warning'}
                    </span>
                    {resultado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-slate-400">payments</span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Pago</span>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${resultado.pagado ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {resultado.pagado ? 'check_circle' : 'cancel'}
                    </span>
                    {resultado.pagado ? 'Al día' : 'Sin pagar'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="px-4 py-6 bg-red-50 dark:bg-red-500/10 flex flex-col items-center gap-2 text-center">
              <span className="material-symbols-outlined text-4xl text-red-400">person_off</span>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Jugador no encontrado</p>
              <p className="text-xs text-red-500/80 dark:text-red-400/70">DNI {resultado.dni} no está registrado en este club</p>
            </div>
          )}

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleNueva}
              className="w-full text-sm text-primary font-medium hover:underline"
            >
              Verificar otro jugador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
