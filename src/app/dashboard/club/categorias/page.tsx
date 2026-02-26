'use client'

import { useState, useEffect } from 'react'
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '@/lib/api'
import type { Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function ClubCategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState<Categoria | null>(null)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
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
    } catch (err) {
      setNotification({
        open: true,
        title: 'Error al cargar categorías',
        message: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNueva = () => {
    setEditando(null)
    setNombre('')
    setError('')
    setShowModal(true)
  }

  const handleEditar = (cat: Categoria) => {
    setEditando(cat)
    setNombre(cat.nombre)
    setError('')
    setShowModal(true)
  }

  const handleEliminar = async () => {
    if (!confirmEliminar) return

    try {
      await deleteCategoria(confirmEliminar.id)
      setCategorias(prev => prev.filter(c => c.id !== confirmEliminar.id))
      setConfirmEliminar(null)
      setNotification({ open: true, title: 'Categoría eliminada', message: 'La categoría fue eliminada correctamente', type: 'success' })
    } catch (err) {
      setConfirmEliminar(null)
      setNotification({ open: true, title: 'Error al eliminar', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
    }
  }

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      setError('Ingresá un valor')
      return
    }

    try {
      setSubmitting(true)

      if (editando) {
        const updated = await updateCategoria(editando.id, { nombre: nombre.trim() })
        setCategorias(prev => prev.map(c => c.id === editando.id ? updated : c))
        setNotification({ open: true, title: 'Categoría actualizada', message: `Categoría "${nombre}" actualizada`, type: 'success' })
      } else {
        const created = await createCategoria({ nombre: nombre.trim() })
        setCategorias(prev => [...prev, created])
        setNotification({ open: true, title: 'Categoría creada', message: `Categoría "${nombre}" creada`, type: 'success' })
      }

      setShowModal(false)
    } catch (err) {
      setNotification({ open: true, title: editando ? 'Error al actualizar' : 'Error al crear', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
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
            Administrá las categorías del club
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

      {/* Lista */}
      {categorias.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">category</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay categorías creadas</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primera categoría haciendo clic en &quot;Nueva Categoría&quot;</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {categorias.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.nombre}</span>
              <button
                onClick={() => handleEditar(cat)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-base text-slate-400 hover:text-primary">edit</span>
              </button>
              <button
                onClick={() => setConfirmEliminar(cat)}
                className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-base text-slate-400 hover:text-red-500">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editando ? 'Editar categoría' : 'Nueva categoría'}
            </h3>

            <div className="mb-5">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Categoría <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => { setNombre(e.target.value); setError('') }}
                placeholder="Ej: 30, 40, 50"
                maxLength={50}
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGuardar() }}
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Se mostrará como +{nombre || '30'}</p>
            </div>

            <div className="flex gap-3">
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
                  editando ? 'Guardar' : 'Crear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmEliminar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setConfirmEliminar(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar categoría</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de eliminar la categoría <span className="font-semibold text-slate-900 dark:text-white">"{confirmEliminar.nombre}"</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Eliminar
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
