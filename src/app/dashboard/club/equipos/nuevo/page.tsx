'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createEquipo, uploadEquipoLogo, getCategorias } from '@/lib/api'
import { compressImage } from '@/lib/imageUtils'
import type { Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function NuevoEquipoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nombre, setNombre] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([])
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  })

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const toggleCategoria = (id: string) => {
    setSelectedCatIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrors(prev => ({ ...prev, imagen: 'Solo se permiten imágenes JPEG, PNG o WebP' }))
      return
    }

    try {
      setCompressing(true)
      setErrors(prev => { const next = { ...prev }; delete next.imagen; return next })
      const compressed = await compressImage(file)
      setImageFile(compressed)
      setImagePreview(URL.createObjectURL(compressed))
    } catch {
      setErrors(prev => ({ ...prev, imagen: 'Error al procesar la imagen' }))
    } finally {
      setCompressing(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (nombre.length > 200) {
      newErrors.nombre = 'El nombre no puede exceder 200 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)
      let logo_url: string | undefined

      if (imageFile) {
        const result = await uploadEquipoLogo(imageFile)
        logo_url = result.url
      }

      await createEquipo({
        nombre: nombre.trim(),
        logo_url,
        categoria_ids: selectedCatIds.length > 0 ? selectedCatIds : undefined,
      })

      setNotification({
        open: true,
        title: 'Equipo creado',
        message: `El equipo "${nombre}" fue creado exitosamente`,
        type: 'success'
      })

      setTimeout(() => {
        router.push('/dashboard/club/equipos')
      }, 2000)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al crear equipo',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nuevo Equipo</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Creá un nuevo equipo para tu club
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Nombre del equipo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              if (errors.nombre) setErrors(prev => { const next = { ...prev }; delete next.nombre; return next })
            }}
            placeholder="Ej: Los Halcones"
            maxLength={200}
            className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
              errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
            }`}
          />
          {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
            Logo del equipo
          </label>

          {imagePreview ? (
            <div className="flex items-center gap-4">
              <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-300">{imageFile?.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                </p>
                <button
                  type="button"
                  onClick={removeImage}
                  className="mt-1 text-xs text-red-500 hover:text-red-400 font-medium"
                >
                  Quitar imagen
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5 ${
                errors.imagen ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            >
              {compressing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Comprimiendo imagen...</p>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500">add_photo_alternate</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Hacé clic para seleccionar una imagen</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">JPEG, PNG o WebP. Se comprime automáticamente.</p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
          {errors.imagen && <p className="text-red-400 text-xs mt-1">{errors.imagen}</p>}
        </div>

        {/* Categorías */}
        {categorias.length > 0 && (
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
              Categorías
            </label>
            <div className="space-y-1.5">
              {categorias.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCatIds.includes(cat.id)}
                    onChange={() => toggleCategoria(cat.id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/50"
                  />
                  <span className="text-sm text-slate-900 dark:text-white">{cat.nombre}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || compressing}
            className="flex-1 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">add</span>
                Crear Equipo
              </>
            )}
          </button>
        </div>
      </form>

      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
