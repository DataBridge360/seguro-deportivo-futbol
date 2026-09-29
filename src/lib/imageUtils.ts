function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Downscales an image to fit inside a maxWidth x maxWidth box and re-encodes it.
 * Prefers WebP (0.82) and falls back to JPEG when the browser cannot encode WebP.
 * The `quality` argument is kept for compatibility and used for the JPEG fallback.
 */
export function compressImage(
  file: File,
  maxWidth = 512,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = async () => {
      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        const ratio = Math.min(1, maxWidth / Math.max(width, height))
        width = Math.max(1, Math.round(width * ratio))
        height = Math.max(1, Math.round(height * ratio))

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo crear el contexto del canvas'))
          return
        }

        // White backdrop so transparent PNGs do not turn black when exported as JPEG
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        let type = 'image/webp'
        let ext = 'webp'
        let blob = await toBlob(canvas, type, 0.82)
        if (!blob || blob.type !== type) {
          type = 'image/jpeg'
          ext = 'jpg'
          blob = await toBlob(canvas, type, quality)
        }
        if (!blob) {
          reject(new Error('Error al comprimir la imagen'))
          return
        }

        const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
        resolve(new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() }))
      } catch {
        reject(new Error('Error al comprimir la imagen'))
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Error al cargar la imagen'))
    }

    img.src = url
  })
}
