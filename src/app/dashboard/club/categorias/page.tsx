'use client'

import { useState } from 'react'
import { MOCK_CATEGORIAS_CLUB } from '@/lib/mockData'
import type { CategoriaClub } from '@/lib/mockData'
import NotificationModal from '@/components/ui/NotificationModal'

export default function ClubCategoriasPage() {
  const [categorias, setCategorias] = useState<CategoriaClub[]>(MOCK_CATEGORIAS_CLUB)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<CategoriaClub | null>(null)
  const [form, setForm] = useState({ nombre: '', edadMinima: '', descripcion: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const handleNueva = () => {
    setEditando(null)
    setForm({ nombre: '', edadMinima: '', descripcion: '' })
    setErrors({})
    setShowModal(true)
  }

  const handleEditar = (cat: CategoriaClub) => {
    setEditando(cat)
    setForm({ nombre: cat.nombre, edadMinima: String(cat.edadMinima), descripcion: cat.descripcion })
    setErrors({})
    setShowModal(true)
  }

  const handleEliminar = (id: string) => {
    setCategorias(prev => prev.filter(c => c.id !== id))
    setNotification({ open: true, title: 'Categoria eliminada', message: 'La categoria fue eliminada correctamente.', type: 'success' })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!form.edadMinima || parseInt(form.edadMinima) < 1) newErrors.edadMinima = 'La edad minima es obligatoria'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = () => {
    if (!validate()) return

    if (editando) {
      setCategorias(prev => prev.map(c => c.id === editando.id ? {
        ...c,
        nombre: form.nombre.trim(),
        edadMinima: parseInt(form.edadMinima),
        descripcion: form.descripcion.trim(),
      } : c))
      setNotification({ open: true, title: 'Categoria actualizada', message: `La categoria "${form.nombre}" fue actualizada correctamente.`, type: 'success' })
    } else {
      const nueva: CategoriaClub = {
        id: String(Date.now()),
        nombre: form.nombre.trim(),
        edadMinima: parseInt(form.edadMinima),
        descripcion: form.descripcion.trim(),
        jugadoresCount: 0,
      }
      setCategorias(prev => [...prev, nueva])
      setNotification({ open: true, title: 'Categoria creada', message: `La categoria "${form.nombre}" fue creada correctamente.`, type: 'success' })
    }
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categorias</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra las categorias del club por edad
          </p>
        </div>
        <button
          onClick={handleNueva}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Nueva Categoria
        </button>
      </div>

      {/* Lista de categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat.nombre}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Edad minima: {cat.edadMinima} años</p>
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
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{cat.descripcion}</p>
            )}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-sm text-slate-400">group</span>
              <span className="text-sm text-slate-600 dark:text-slate-300">{cat.jugadoresCount} jugadores</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editando ? 'Editar categoria' : 'Nueva categoria'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: +35"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Edad minima</label>
                <input
                  type="number"
                  value={form.edadMinima}
                  onChange={(e) => setForm(prev => ({ ...prev, edadMinima: e.target.value }))}
                  placeholder="Ej: 35"
                  min="1"
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${errors.edadMinima ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
                {errors.edadMinima && <p className="text-red-400 text-xs mt-1">{errors.edadMinima}</p>}
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Descripcion (opcional)</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej: Jugadores mayores de 35 años"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardar} className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
                {editando ? 'Guardar cambios' : 'Crear categoria'}
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
