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

  // Scanner: scannerVisible renderiza el video, scannerActive inicia el loop
  const [scannerVisible, setScannerVisible] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  const stopScanner = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScannerActive(false)
    setScannerVisible(false)
  }, [])

  // Cuando el video está en el DOM (scannerVisible=true), obtener la cámara
  useEffect(() => {
    if (!scannerVisible) return
    let active = true
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
          setScannerActive(true)
        }
      })
      .catch(() => {
        if (active) {
          setScannerVisible(false)
          setError('No se pudo acceder a la cámara. Ingresá el DNI manualmente.')
        }
      })
    return () => { active = false }
  }, [scannerVisible])

  // Scan loop idéntico al de cantina
  useEffect(() => {
    if (!scannerActive || !videoRef.current) return
    const video = videoRef.current

    const scan = async () => {
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan)
        return
      }
      try {
        let scannedValue: string | null = null
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(video)
          if (codes.length > 0) scannedValue = codes[0].rawValue as string
        } else {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          canvas.getContext('2d')!.drawImage(video, 0, 0)
          const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(imageData.data, imageData.width, imageData.height)
          if (result) scannedValue = result.data
        }
        if (scannedValue !== null) {
          const value = scannedValue.trim()
          stopScanner()
          setDni(value)
          try {
            setLoading(true)
            setError('')
            const data = await verificarJugadorDNI(value)
            setResultado({ ...data, dni: value })
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al verificar')
          } finally {
            setLoading(false)
          }
          return
        }
      } catch { /* ignorar errores de detección */ }
      animFrameRef.current = requestAnimationFrame(scan)
    }

    animFrameRef.current = requestAnimationFrame(scan)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [scannerActive, stopScanner])

  useEffect(() => () => stopScanner(), [stopScanner])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = dni.trim()
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

  const handleNueva = () => {
    setResultado(null)
    setDni('')
    setError('')
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verificar jugador</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Escaneá el QR del carnet o ingresá el DNI</p>
      </div>

      {/* Scanner area */}
      {scannerVisible ? (
        <div className="bg-black rounded-2xl overflow-hidden relative">
          <video ref={videoRef} className="w-full aspect-square object-cover" muted playsInline />
          {/* Targeting overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
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
        /* Botón escanear QR */
        <button
          onClick={() => { setError(''); setResultado(null); setScannerVisible(true) }}
          className="w-full flex items-center gap-4 p-4 bg-primary text-white rounded-2xl shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
          </div>
          <div className="text-left">
            <p className="font-bold text-base leading-tight">Escanear QR del carnet</p>
            <p className="text-xs text-white/75 mt-0.5">Usá la cámara para leer el código</p>
          </div>
          <span className="material-symbols-outlined text-white/60 ml-auto">chevron_right</span>
        </button>
      )}

      {/* Separador */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">o ingresá el DNI</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Manual input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={dni}
          onChange={e => { setDni(e.target.value); setError(''); setResultado(null) }}
          placeholder="Ej: 38123456"
          className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !dni.trim()}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <span className="material-symbols-outlined text-lg">search</span>
          }
          Buscar
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Result card */}
      {resultado && (
        <div className={`rounded-2xl border-2 overflow-hidden ${resultado.encontrado ? 'border-slate-200 dark:border-slate-700' : 'border-red-200 dark:border-red-500/30'}`}>
          {resultado.encontrado ? (
            <>
              <div className="px-4 py-4 bg-white dark:bg-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl text-slate-400" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {resultado.apellido}, {resultado.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {resultado.dni}</p>
                </div>
              </div>

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
            <button onClick={handleNueva} className="w-full text-sm text-primary font-medium hover:underline">
              Verificar otro jugador
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
