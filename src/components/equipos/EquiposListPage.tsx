'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  getEquipos, getCategorias, updateEquipo, deleteEquipo, uploadEquipoLogo,
  createCategoria, updateCategoria, deleteCategoria,
} from '@/lib/api'
import { compressImage } from '@/lib/imageUtils'
import type { Equipo, Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

interface Props {
  basePath: string // e.g. "/dashboard/club/equipos"
}

export default function EquiposListPage({ basePath }: Props) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, title: '', message: '', type: 'info'
  })

  // Categorías
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([])
  const [catEditId, setCatEditId] = useState<string | null>(null)
  const [catNombre, setCatNombre] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [catNewOpen, setCatNewOpen] = useState(false)
  const [catSectionOpen, setCatSectionOpen] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)

  // Edit modal
  const [editModal, setEditModal] = useState<Equipo | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editCatIds, setEditCatIds] = useState<string[]>([])
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editCompressing, setEditCompressing] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<Equipo | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Delete category confirmation
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<Categoria | null>(null)
  const [deleteCatLoading, setDeleteCatLoading] = useState(false)

  // Discard changes confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!menuAbiertoId) return
    const handler = () => setMenuAbiertoId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuAbiertoId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [equiposData, categoriasData] = await Promise.all([
        getEquipos(),
        getCategorias()
      ])
      setEquipos(equiposData)
      setAllCategorias(categoriasData)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar datos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const equiposFiltrados = useMemo(() => {
    let result = equipos
    if (busqueda.trim()) {
      const query = busqueda.toLowerCase().trim()
      result = result.filter(e => e.nombre.toLowerCase().includes(query))
    }
    if (filtroCategoria) {
      result = result.filter(e => e.categorias?.some(c => c.id === filtroCategoria))
    }
    return result
  }, [equipos, busqueda, filtroCategoria])

  // ─── Categorías ────────────────────────────────────────

  const startEditCat = (cat: Categoria) => {
    setCatEditId(cat.id)
    setCatNombre(cat.nombre)
    setCatNewOpen(false)
  }

  const cancelEditCat = () => {
    setCatEditId(null)
    setCatNombre('')
    setCatNewOpen(false)
  }

  const handleSaveCat = async () => {
    if (!catNombre.trim()) return
    try {
      setCatSubmitting(true)
      if (catEditId) {
        const updated = await updateCategoria(catEditId, { nombre: catNombre.trim() })
        setAllCategorias(prev => prev.map(c => c.id === catEditId ? updated : c))
        const equiposData = await getEquipos()
        setEquipos(equiposData)
        setNotification({ open: true, title: 'Categoría actualizada', message: `"${catNombre.trim()}"`, type: 'success' })
      } else {
        const created = await createCategoria({ nombre: catNombre.trim() })
        setAllCategorias(prev => [...prev, created])
        setNotification({ open: true, title: 'Categoría creada', message: `"${catNombre.trim()}"`, type: 'success' })
      }
      cancelEditCat()
    } catch (err) {
      setNotification({ open: true, title: 'Error', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
    } finally {
      setCatSubmitting(false)
    }
  }

  const handleDeleteCatConfirmed = async () => {
    if (!deleteCatConfirm) return
    const cat = deleteCatConfirm
    try {
      setDeleteCatLoading(true)
      await deleteCategoria(cat.id)
      setAllCategorias(prev => prev.filter(c => c.id !== cat.id))
      if (filtroCategoria === cat.id) setFiltroCategoria(null)
      const equiposData = await getEquipos()
      setEquipos(equiposData)
      setDeleteCatConfirm(null)
      setNotification({ open: true, title: 'Categoría eliminada', message: `"${cat.nombre}"`, type: 'success' })
    } catch (err) {
      setDeleteCatConfirm(null)
      setNotification({ open: true, title: 'Error al eliminar', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
    } finally {
      setDeleteCatLoading(false)
    }
  }

  // ─── Edit ─────────────────────────────────────────────

  const openEditModal = (equipo: Equipo) => {
    setEditModal(equipo)
    setEditNombre(equipo.nombre)
    setEditCatIds(equipo.categorias?.map(c => c.id) || [])
    setEditImageFile(null)
    setEditImagePreview(null)
    setEditError('')
  }

  const hasEditChanges = (): boolean => {
    if (!editModal) return false
    if (editNombre.trim() !== editModal.nombre) return true
    if (editImageFile) return true
    const originalCatIds = (editModal.categorias?.map(c => c.id) || []).sort()
    const currentCatIds = [...editCatIds].sort()
    if (JSON.stringify(originalCatIds) !== JSON.stringify(currentCatIds)) return true
    return false
  }

  const closeEditModal = () => {
    setEditModal(null)
    setEditNombre('')
    setEditCatIds([])
    setEditImageFile(null)
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImagePreview(null)
    setEditError('')
    setShowDiscardConfirm(false)
  }

  const tryCloseEditModal = () => {
    if (hasEditChanges()) {
      setShowDiscardConfirm(true)
    } else {
      closeEditModal()
    }
  }

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setNotification({ open: true, title: 'Error', message: 'Solo se permiten imágenes JPEG, PNG o WebP', type: 'error' })
      return
    }
    try {
      setEditCompressing(true)
      const compressed = await compressImage(file)
      setEditImageFile(compressed)
      if (editImagePreview) URL.revokeObjectURL(editImagePreview)
      setEditImagePreview(URL.createObjectURL(compressed))
    } catch {
      setNotification({ open: true, title: 'Error', message: 'Error al procesar la imagen', type: 'error' })
    } finally {
      setEditCompressing(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!editModal) return
    if (!editNombre.trim()) {
      setEditError('El nombre es obligatorio')
      return
    }
    if (editNombre.length > 200) {
      setEditError('Máximo 200 caracteres')
      return
    }
    if (editCatIds.length === 0) {
      setEditError('Seleccioná al menos una categoría')
      return
    }

    try {
      setEditLoading(true)
      let logo_url: string | undefined
      if (editImageFile) {
        const result = await uploadEquipoLogo(editImageFile)
        logo_url = result.url
      }

      const updateData: { nombre?: string; logo_url?: string; categoria_ids?: string[] } = {}
      if (editNombre.trim() !== editModal.nombre) updateData.nombre = editNombre.trim()
      if (logo_url) updateData.logo_url = logo_url

      const currentCatIds = (editModal.categorias?.map(c => c.id) || []).sort()
      const newCatIds = [...editCatIds].sort()
      if (JSON.stringify(currentCatIds) !== JSON.stringify(newCatIds)) updateData.categoria_ids = editCatIds

      if (Object.keys(updateData).length > 0) await updateEquipo(editModal.id, updateData)

      setNotification({ open: true, title: 'Equipo actualizado', message: 'Los cambios fueron guardados', type: 'success' })
      closeEditModal()
      const equiposData = await getEquipos()
      setEquipos(equiposData)
    } catch (error) {
      setNotification({ open: true, title: 'Error al actualizar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setEditLoading(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────

  const openDeleteModal = (equipo: Equipo) => {
    setDeleteModal(equipo)
    setDeletePassword('')
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    setDeleteModal(null)
    setDeletePassword('')
    setDeleteError('')
  }

  const handleDeleteSubmit = async () => {
    if (!deleteModal || !deletePassword) return
    try {
      setDeleteLoading(true)
      setDeleteError('')
      await deleteEquipo(deleteModal.id, deletePassword)
      setNotification({ open: true, title: 'Equipo eliminado', message: `"${deleteModal.nombre}" fue eliminado`, type: 'success' })
      closeDeleteModal()
      const equiposData = await getEquipos()
      setEquipos(equiposData)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Equipos</h1>
      </div>

      {/* ── Sección: Categorías (desplegable) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          onClick={() => setCatSectionOpen(!catSectionOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">category</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Categorías</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {allCategorias.length} categoría{allCategorias.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform duration-200 ${catSectionOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {catSectionOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
            <div className="pt-3 space-y-2">
              {allCategorias.length === 0 && !catNewOpen ? (
                <div className="flex flex-col items-center py-4 gap-2">
                  <p className="text-sm text-slate-400 dark:text-slate-500">No hay categorías creadas</p>
                  <button
                    onClick={() => { setCatNewOpen(true); setCatEditId(null); setCatNombre('') }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Crear categoría
                  </button>
                </div>
              ) : (
                <>
                  {allCategorias.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                      {catEditId === cat.id ? (
                        <>
                          <input
                            type="text"
                            value={catNombre}
                            onChange={(e) => setCatNombre(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && catNombre.trim()) handleSaveCat(); if (e.key === 'Escape') cancelEditCat() }}
                            maxLength={50}
                            autoFocus
                            className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-primary rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            onClick={handleSaveCat}
                            disabled={catSubmitting || !catNombre.trim()}
                            className="shrink-0 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {catSubmitting ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelEditCat}
                            className="shrink-0 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">{cat.nombre}</span>
                          <button
                            onClick={() => startEditCat(cat)}
                            className="shrink-0 p-1.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteCatConfirm(cat)}
                            className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {catNewOpen && !catEditId ? (
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                      <input
                        type="text"
                        value={catNombre}
                        onChange={(e) => setCatNombre(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && catNombre.trim()) handleSaveCat(); if (e.key === 'Escape') cancelEditCat() }}
                        placeholder="Nombre de la categoría"
                        maxLength={50}
                        autoFocus
                        className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-primary rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveCat}
                        disabled={catSubmitting || !catNombre.trim()}
                        className="shrink-0 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {catSubmitting ? 'Creando...' : 'Crear'}
                      </button>
                      <button
                        onClick={cancelEditCat}
                        className="shrink-0 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : !catEditId && (
                    <button
                      onClick={() => { setCatNewOpen(true); setCatEditId(null); setCatNombre('') }}
                      className="flex items-center gap-1.5 px-3 py-2 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      Agregar categoría
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Sección: Equipos ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">groups</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Equipos</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {equipos.length} equipo{equipos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Link
            href={`${basePath}/nuevo`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Nuevo
          </Link>
        </div>

        <div className="p-4">
          {/* Filtros */}
          {equipos.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined text-lg text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar equipo..."
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <span className="material-symbols-outlined text-base text-slate-400 hover:text-slate-600">close</span>
                  </button>
                )}
              </div>

              {allCategorias.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <button
                    onClick={() => setFiltroCategoria(null)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      !filtroCategoria
                        ? 'bg-primary text-white'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                    }`}
                  >
                    Todas
                  </button>
                  {allCategorias.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setFiltroCategoria(filtroCategoria === cat.id ? null : cat.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        filtroCategoria === cat.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grid */}
          {equipos.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">groups</span>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">No hay equipos creados</p>
            </div>
          ) : equiposFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">search_off</span>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {equiposFiltrados.map((equipo) => (
                <div
                  key={equipo.id}
                  onClick={() => openEditModal(equipo)}
                  className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {equipo.logo_url ? (
                      <img src={equipo.logo_url} alt={equipo.nombre} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xl text-slate-400">shield</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{equipo.nombre}</h3>
                      {equipo.categorias && equipo.categorias.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {equipo.categorias.map((cat) => (
                            <span key={cat.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {cat.nombre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuAbiertoId(menuAbiertoId === equipo.id ? null : equipo.id)
                        }}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>

                      {menuAbiertoId === equipo.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[130px]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(null); openEditModal(equipo) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                            Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setMenuAbiertoId(null); openDeleteModal(equipo) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal — se abre directo al hacer clic en la card */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={tryCloseEditModal}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Editar equipo</h3>

            {/* Nombre */}
            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => { setEditNombre(e.target.value); setEditError('') }}
                maxLength={200}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                  editError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {editError && <p className="text-red-400 text-xs mt-1">{editError}</p>}
            </div>

            {/* Logo */}
            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Logo</label>
              <div className="flex items-center gap-3">
                {(editImagePreview || editModal.logo_url) ? (
                  <img src={editImagePreview || editModal.logo_url || ''} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl text-slate-400">shield</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  disabled={editCompressing}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {editCompressing ? 'Comprimiendo...' : 'Cambiar'}
                </button>
              </div>
              <input ref={editFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditImageChange} className="hidden" />
            </div>

            {/* Categorías */}
            {allCategorias.length > 0 && (
              <div className="mb-5">
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Categorías</label>
                <div className="flex flex-wrap gap-1.5">
                  {allCategorias.map((cat) => {
                    const selected = editCatIds.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditCatIds(prev =>
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
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={tryCloseEditModal}
                disabled={editLoading}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading || editCompressing || !editNombre.trim() || editCatIds.length === 0}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeDeleteModal}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Eliminar equipo</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Estás por eliminar <strong>&quot;{deleteModal.nombre}&quot;</strong>. Esta acción no se puede deshacer.
            </p>

            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                  deleteError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
                onKeyDown={(e) => { if (e.key === 'Enter' && deletePassword) handleDeleteSubmit() }}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deleteCatConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !deleteCatLoading && setDeleteCatConfirm(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Eliminar categoría</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Estás por eliminar <strong>&quot;{deleteCatConfirm.nombre}&quot;</strong>. Se quitará de todos los equipos que la tengan asignada.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteCatConfirm(null)}
                disabled={deleteCatLoading}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCatConfirmed}
                disabled={deleteCatLoading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteCatLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discard Changes Confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setShowDiscardConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-lg">edit_off</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cambios sin guardar</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Tenés cambios sin guardar. Si salís ahora, vas a perder la edición.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Seguir editando
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Descartar
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
