'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  getEquipos, getCategorias, updateEquipo, deleteEquipo, uploadEquipoLogo,
  createCategoria, updateCategoria, deleteCategoria
} from '@/lib/api'
import { compressImage } from '@/lib/imageUtils'
import type { Equipo, Categoria } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [loading, setLoading] = useState(true)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  // Categorías
  const [allCategorias, setAllCategorias] = useState<Categoria[]>([])

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)

  // Categorías management
  const [catModal, setCatModal] = useState(false)
  const [catEditando, setCatEditando] = useState<Categoria | null>(null)
  const [catNombre, setCatNombre] = useState('')
  const [catError, setCatError] = useState('')
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [showCatSection, setShowCatSection] = useState(false)

  // Edit modal state
  const [editModal, setEditModal] = useState<Equipo | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editCatIds, setEditCatIds] = useState<string[]>([])
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editCompressing, setEditCompressing] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<Equipo | null>(null)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  // Cerrar menú al hacer click fuera
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

  // Equipos filtrados
  const equiposFiltrados = useMemo(() => {
    let result = equipos

    if (busqueda.trim()) {
      const query = busqueda.toLowerCase().trim()
      result = result.filter(e => e.nombre.toLowerCase().includes(query))
    }

    if (filtroCategoria) {
      result = result.filter(e =>
        e.categorias?.some(c => c.id === filtroCategoria)
      )
    }

    return result
  }, [equipos, busqueda, filtroCategoria])

  // ─── Categoría handlers ────────────────────────────────

  const handleNuevaCategoria = () => {
    setCatEditando(null)
    setCatNombre('')
    setCatError('')
    setCatModal(true)
  }

  const handleEditarCategoria = (cat: Categoria) => {
    setCatEditando(cat)
    setCatNombre(cat.nombre)
    setCatError('')
    setCatModal(true)
  }

  const handleEliminarCategoria = async (cat: Categoria) => {
    try {
      await deleteCategoria(cat.id)
      setAllCategorias(prev => prev.filter(c => c.id !== cat.id))
      if (filtroCategoria === cat.id) setFiltroCategoria(null)
      // Reload equipos to update their category associations
      const equiposData = await getEquipos()
      setEquipos(equiposData)
      setNotification({ open: true, title: 'Categoría eliminada', message: `Se eliminó "${cat.nombre}"`, type: 'success' })
    } catch (err) {
      setNotification({ open: true, title: 'Error al eliminar', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
    }
  }

  const handleGuardarCategoria = async () => {
    if (!catNombre.trim()) {
      setCatError('Ingresá un valor')
      return
    }

    try {
      setCatSubmitting(true)

      if (catEditando) {
        const updated = await updateCategoria(catEditando.id, { nombre: catNombre.trim() })
        setAllCategorias(prev => prev.map(c => c.id === catEditando.id ? updated : c))
        // Reload equipos to reflect updated category name
        const equiposData = await getEquipos()
        setEquipos(equiposData)
        setNotification({ open: true, title: 'Categoría actualizada', message: `Categoría "${catNombre}" actualizada`, type: 'success' })
      } else {
        const created = await createCategoria({ nombre: catNombre.trim() })
        setAllCategorias(prev => [...prev, created])
        setNotification({ open: true, title: 'Categoría creada', message: `Categoría "${catNombre}" creada`, type: 'success' })
      }

      setCatModal(false)
    } catch (err) {
      setNotification({ open: true, title: catEditando ? 'Error al actualizar' : 'Error al crear', message: err instanceof Error ? err.message : 'Error desconocido', type: 'error' })
    } finally {
      setCatSubmitting(false)
    }
  }

  // ─── Edit handlers ─────────────────────────────────────

  const openEditModal = (equipo: Equipo) => {
    setEditModal(equipo)
    setEditNombre(equipo.nombre)
    setEditCatIds(equipo.categorias?.map(c => c.id) || [])
    setEditImageFile(null)
    setEditImagePreview(null)
  }

  const closeEditModal = () => {
    setEditModal(null)
    setEditNombre('')
    setEditCatIds([])
    setEditImageFile(null)
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImagePreview(null)
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
    if (!editNombre.trim()) return

    try {
      setEditLoading(true)
      let logo_url: string | undefined

      if (editImageFile) {
        const result = await uploadEquipoLogo(editImageFile)
        logo_url = result.url
      }

      const updateData: { nombre?: string; logo_url?: string; categoria_ids?: string[] } = {}
      if (editNombre.trim() !== editModal.nombre) {
        updateData.nombre = editNombre.trim()
      }
      if (logo_url) {
        updateData.logo_url = logo_url
      }

      const currentCatIds = (editModal.categorias?.map(c => c.id) || []).sort()
      const newCatIds = [...editCatIds].sort()
      if (JSON.stringify(currentCatIds) !== JSON.stringify(newCatIds)) {
        updateData.categoria_ids = editCatIds
      }

      if (Object.keys(updateData).length > 0) {
        await updateEquipo(editModal.id, updateData)
      }

      setNotification({
        open: true,
        title: 'Equipo actualizado',
        message: `El equipo fue actualizado exitosamente`,
        type: 'success'
      })

      closeEditModal()
      const equiposData = await getEquipos()
      setEquipos(equiposData)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al actualizar',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setEditLoading(false)
    }
  }

  // ─── Delete handlers ────────────────────────────────────

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

      setNotification({
        open: true,
        title: 'Equipo eliminado',
        message: `El equipo "${deleteModal.nombre}" fue eliminado`,
        type: 'success'
      })

      closeDeleteModal()
      setEquipoSeleccionado(null)
      const equiposData = await getEquipos()
      setEquipos(equiposData)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Equipos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestioná los equipos del club</p>
        </div>
        <Link
          href="/dashboard/productor/equipos/nuevo"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nuevo Equipo
        </Link>
      </div>

      {/* Categorías section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setShowCatSection(!showCatSection)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-slate-500 dark:text-slate-400">category</span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">Categorías</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">({allCategorias.length})</span>
          </div>
          <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${showCatSection ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showCatSection && (
          <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
            {allCategorias.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">No hay categorías creadas</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3">
                {allCategorias.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.nombre}</span>
                    <button
                      onClick={() => handleEditarCategoria(cat)}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400 hover:text-primary">edit</span>
                    </button>
                    <button
                      onClick={() => handleEliminarCategoria(cat)}
                      className="p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400 hover:text-red-500">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleNuevaCategoria}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Nueva Categoría
            </button>
          </div>
        )}
      </div>

      {/* Filtros */}
      {equipos.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Búsqueda por nombre */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-lg text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <span className="material-symbols-outlined text-base text-slate-400 hover:text-slate-600">close</span>
              </button>
            )}
          </div>

          {/* Filtro por categoría */}
          {allCategorias.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setFiltroCategoria(null)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  !filtroCategoria
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
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
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/40'
                  }`}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid de equipos */}
      {equipos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">groups</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay equipos creados</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Creá tu primer equipo haciendo clic en &quot;Nuevo Equipo&quot;</p>
        </div>
      ) : equiposFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">search_off</span>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No se encontraron equipos</p>
          <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Probá con otro filtro o nombre</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equiposFiltrados.map((equipo) => (
            <div
              key={equipo.id}
              onClick={() => setEquipoSeleccionado(equipo)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-4 cursor-pointer hover:border-primary/40 transition-colors"
            >
              {/* Logo, nombre y menú */}
              <div className="flex items-start gap-3">
                {equipo.logo_url ? (
                  <img src={equipo.logo_url} alt={equipo.nombre} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">shield</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{equipo.nombre}</h3>
                </div>

                {/* Menú 3 puntos */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuAbiertoId(menuAbiertoId === equipo.id ? null : equipo.id)
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">more_vert</span>
                  </button>

                  {menuAbiertoId === equipo.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuAbiertoId(null)
                          openEditModal(equipo)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuAbiertoId(null)
                          openDeleteModal(equipo)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Categorías */}
              {equipo.categorias && equipo.categorias.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1.5">Categorías</p>
                  <div className="flex flex-wrap gap-1.5">
                    {equipo.categorias.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {cat.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalle */}
      {equipoSeleccionado && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setEquipoSeleccionado(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              {equipoSeleccionado.logo_url ? (
                <img src={equipoSeleccionado.logo_url} alt={equipoSeleccionado.nombre} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-slate-400">shield</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {equipoSeleccionado.nombre}
                </h3>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-2">
                Categorías
              </p>
              {equipoSeleccionado.categorias && equipoSeleccionado.categorias.length > 0 ? (
                <div className="space-y-1.5">
                  {equipoSeleccionado.categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                    >
                      <span className="material-symbols-outlined text-lg text-green-500">check_circle</span>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{cat.nombre}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">Sin categorías asignadas</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEquipoSeleccionado(null)
                  openEditModal(equipoSeleccionado)
                }}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Editar
              </button>
              <button
                onClick={() => setEquipoSeleccionado(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {editModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeEditModal}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Editar equipo</h3>

            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Nombre del equipo
              </label>
              <input
                type="text"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                maxLength={200}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="mb-5">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Logo
              </label>
              <div className="flex items-center gap-3">
                {(editImagePreview || editModal.logo_url) ? (
                  <img
                    src={editImagePreview || editModal.logo_url || ''}
                    alt="Logo"
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-slate-400">shield</span>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => editFileRef.current?.click()}
                    disabled={editCompressing}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {editCompressing ? 'Comprimiendo...' : 'Cambiar imagen'}
                  </button>
                  {editImageFile && (
                    <p className="text-xs text-slate-400 mt-1">{(editImageFile.size / 1024).toFixed(0)} KB</p>
                  )}
                </div>
              </div>
              <input
                ref={editFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleEditImageChange}
                className="hidden"
              />
            </div>

            {allCategorias.length > 0 && (
              <div className="mb-5">
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Categorías
                </label>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {allCategorias.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={editCatIds.includes(cat.id)}
                        onChange={() => setEditCatIds(prev =>
                          prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id]
                        )}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/50"
                      />
                      <span className="text-sm text-slate-900 dark:text-white">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={closeEditModal}
                disabled={editLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editLoading || editCompressing || !editNombre.trim()}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {deleteModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar equipo</h3>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
              Estás por eliminar el equipo <strong>&quot;{deleteModal.nombre}&quot;</strong>.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Esta acción no se puede deshacer. Ingresá tu contraseña para confirmar.
            </p>

            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                  deleteError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                onKeyDown={(e) => { if (e.key === 'Enter' && deletePassword) handleDeleteSubmit() }}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteLoading || !deletePassword}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar equipo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de categoría (crear/editar) */}
      {catModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !catSubmitting && setCatModal(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {catEditando ? 'Editar categoría' : 'Nueva categoría'}
            </h3>

            <div className="mb-5">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Categoría <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={catNombre}
                onChange={(e) => { setCatNombre(e.target.value); setCatError('') }}
                placeholder="Ej: 30, 40, 50"
                maxLength={50}
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${catError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGuardarCategoria() }}
                autoFocus
              />
              {catError && <p className="text-red-400 text-xs mt-1">{catError}</p>}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ejemplo: Senior, Sub-20, Libre, etc.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCatModal(false)}
                disabled={catSubmitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCategoria}
                disabled={catSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {catSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  catEditando ? 'Guardar' : 'Crear'
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
