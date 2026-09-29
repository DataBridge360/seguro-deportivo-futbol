'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

// Camera QR scanner: BarcodeDetector when available, jsQR as fallback.
// Calls onScan once with the raw QR string and stops the camera.
export function useQrScanner(onScan: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setActive(false)
  }, [])

  const start = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setActive(true)
    } catch {
      setError('No pudimos acceder a la cámara. Escribí el código a mano.')
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    if (!video || !streamRef.current) return
    video.srcObject = streamRef.current
    void video.play().catch(() => {})

    let cancelled = false
    const detector: BarcodeDetectorLike | null =
      'BarcodeDetector' in window
        ? new (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector({
            formats: ['qr_code'],
          })
        : null

    const scan = async () => {
      if (cancelled) return
      if (video.readyState >= 2) {
        try {
          let value: string | null = null
          if (detector) {
            const codes = await detector.detect(video)
            if (codes.length > 0) value = codes[0].rawValue
          } else {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0)
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const result = jsQR(img.data, img.width, img.height)
              if (result) value = result.data
            }
          }
          if (value !== null && !cancelled) {
            stop()
            onScanRef.current(value)
            return
          }
        } catch {
          // ignore detection errors and keep scanning
        }
      }
      frameRef.current = requestAnimationFrame(scan)
    }
    frameRef.current = requestAnimationFrame(scan)

    return () => {
      cancelled = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [active, stop])

  useEffect(() => () => stop(), [stop])

  return { videoRef, active, error, start, stop }
}
