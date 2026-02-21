'use client'

import { useState, useEffect } from 'react'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '@/lib/api'
import type { Categoria, CreateCategoriaDTO, UpdateCategoriaDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function ClubCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateCategoriaDTO>({
    nombre: '',
    descripcion: '',
    edad_minima: undefined,
    edad_maxima: undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    try {
      setLoading(true)
      const data = await getCategorias()
      setCategorias(data)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar categorías',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNueva = () => {
    setEditando(null)
    setForm({
      nombre: '',
      descripcion: '',
      edad_minima: undefined,
      edad_maxima: undefined,
    })
    setErrors({})
    setShowModal(true)
  }

  const handleEditar = (cat: Categoria) => {
    setEditando(cat)
    setForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion || '',
      edad_minima: cat.edad_minima || undefined,
      edad_maxima: cat.edad_maxima || undefined,
    })
    setErrors({})
    setShowModal(true)
  }

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await deleteCategoria(id)
      setCategorias(prev => prev.filter(c => c.id !== id))
      setNotification({
        open: true,
        title: 'Categoría eliminada',
        message: 'La categoría fue eliminada correctamente',
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al eliminar',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (form.nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres'
    }

    if (form.descripcion && form.descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres'
    }

    if (form.edad_minima !== undefined && (form.edad_minima < 5 || form.edad_minima > 100)) {
      newErrors.edad_minima = 'La edad mínima debe estar entre 5 y 100 años'
    }

    if (form.edad_maxima !== undefined && (form.edad_maxima < 5 || form.edad_maxima > 100)) {
      newErrors.edad_maxima = 'La edad máxima debe estar entre 5 y 100 años'
    }

    if (form.edad_minima !== undefined && form.edad_maxima !== undefined && form.edad_minima >= form.edad_maxima) {
      newErrors.edad_maxima = 'La edad máxima debe ser mayor a la edad mínima'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = async () => {
    if (!validate()) return

    try {
      setSubmitting(true)

      const data: CreateCategoriaDTO | UpdateCategoriaDTO = {
        nombre: form.nombre.trim(),
      }

      if (form.descripcion?.trim()) {
        data.descripcion = form.descripcion.trim()
      }

      if (form.edad_minima !== undefined) {
        data.edad_minima = form.edad_minima
      }

      if (form.edad_maxima !== undefined) {
        data.edad_maxima = form.edad_maxima
      }

      if (editando) {
        const updated = await updateCategoria(editando.id, data as UpdateCategoriaDTO)
        setCategorias(prev => prev.map(c => c.id === editando.id ? updated : c))
        setNotification({
          open: true,
          title: 'Categoría actualizada',
          message: `La categoría "${form.nombre}" fue actualizada correctamente`,
          type: 'success'
        })
      } else {
        const created = await createCategoria(data as CreateCategoriaDTO)
        setCategorias(prev => [...prev, created])
        setNotification({
          open: true,
          title: 'Categoría creada',
          message: `La categoría "${form.nombre}" fue creada correctamente`,
          type: 'success'
        })
      }

      setShowModal(false)
    } catch (error) {
      setNotification({
        open: true,
        title: editando ? 'Error al actualizar' : 'Error al crear',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categorías</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administrá las categorías del club por edad
          </p>
        </div>
        <button
          onClick={handleNueva}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nueva Categoría
        </button>
      </div>

      {/* Lista de categorías */}
      {categorias.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">category</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay categorías creadas</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primera categoría haciendo clic en "Nueva Categoría"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((cat) => (
            <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat.nombre}</h3>
                  {(cat.edad_minima || cat.edad_maxima) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {cat.edad_minima && cat.edad_maxima ? `${cat.edad_minima} - ${cat.edad_maxima} años` :
                       cat.edad_minima ? `${cat.edad_minima}+ años` :
                       cat.edad_maxima ? `Hasta ${cat.edad_maxima} años` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditar(cat)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-400 hover:text-primary">edit</span>
                  </button>
                  <button
                    onClick={() => handleEliminar(cat.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg text-slate-400 hover:text-red-500">delete</span>
                  </button>
                </div>
              </div>
              {cat.descripcion && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{cat.descripcion}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editando ? 'Editar categoría' : 'Nueva categoría'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Sub-16"
                  maxLength={100}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Edad mínima</label>
                  <input
                    type="number"
                    value={form.edad_minima || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, edad_minima: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Ej: 12"
                    min="5"
                    max="100"
                    className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.edad_minima ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  />
                  {errors.edad_minima && <p className="text-red-400 text-xs mt-1">{errors.edad_minima}</p>}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Edad máxima</label>
                  <input
                    type="number"
                    value={form.edad_maxima || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, edad_maxima: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Ej: 16"
                    min="5"
                    max="100"
                    className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.edad_maxima ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                  />
                  {errors.edad_maxima && <p className="text-red-400 text-xs mt-1">{errors.edad_maxima}</p>}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción de la categoría (opcional)"
                  maxLength={500}
                  rows={3}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary resize-none ${errors.descripcion ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.descripcion && <p className="text-red-400 text-xs mt-1">{errors.descripcion}</p>}
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{form.descripcion?.length || 0}/500</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editando ? 'Guardar cambios' : 'Crear categoría'
                )}
              </button>
            </div>
          </div>
        </div>
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
