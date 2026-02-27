'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createEquipo, uploadEquipoLogo, getCategorias } from '@/lib/api'
import { compressImage } from '@/lib/imageUtils'
import type { Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

interface Props {
  basePath: string // e.g. "/dashboard/club/equipos"
}

export default function NuevoEquipoForm({ basePath }: Props) {
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
  const [created, setCreated] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success'
  })

  useEffect(() => {
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setErrors(prev => ({ ...prev, imagen: 'Solo JPEG, PNG o WebP' }))
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
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    else if (nombre.length > 200) newErrors.nombre = 'Máximo 200 caracteres'
    if (selectedCatIds.length === 0) newErrors.categorias = 'Seleccioná al menos una categoría'
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
      setCreated(true)
      setNotification({ open: true, title: 'Equipo creado', message: `"${nombre}" fue creado exitosamente`, type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al crear equipo', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Nuevo Equipo</h1>
      </div>

      {created ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-green-500 text-2xl">check</span>
          </div>
          <p className="text-slate-900 dark:text-white font-medium">Equipo creado</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">&quot;{nombre}&quot; fue creado exitosamente</p>
          <button
            onClick={() => router.push(basePath)}
            className="mt-4 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Volver a equipos
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Nombre <span className="text-red-500">*</span>
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
              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                errors.nombre ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Logo — botón simple en vez de dropzone */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
              Logo <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </label>
            {imagePreview ? (
              <div className="flex items-center gap-3">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                  </p>
                  <button type="button" onClick={removeImage} className="text-xs text-red-500 hover:text-red-400 font-medium">
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={compressing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {compressing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Comprimiendo...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                    Subir imagen
                  </>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            {errors.imagen && <p className="text-red-400 text-xs mt-1">{errors.imagen}</p>}
          </div>

          {/* Categorías — pills seleccionables */}
          {categorias.length > 0 && (
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">
                Categorías <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categorias.map((cat) => {
                  const selected = selectedCatIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatIds(prev =>
                        prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                      )}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  )
                })}
              </div>
              {errors.categorias && <p className="text-red-400 text-xs mt-1">{errors.categorias}</p>}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || compressing}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : 'Crear Equipo'}
            </button>
          </div>
        </form>
      )}

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
