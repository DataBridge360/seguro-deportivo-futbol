'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import AnuncioBanner from '@/components/anuncios/AnuncioBanner'
import AnuncioWizard from '@/components/anuncios/AnuncioWizard'
import { ErrorNote, Modal, Spinner, inputCls, labelCls, primaryBtnCls, secondaryBtnCls } from '@/components/club/puntos/ui'
import {
  AnuncioResponse,
  actualizarAnuncio,
  eliminarAnuncio,
  getAnunciosClub,
  reordenarAnuncios,
} from '@/lib/api'

// The jugador home shows the first N announcements that are active and not expired.
const INICIO_MAX = 6

function todayDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isVigente(anuncio: AnuncioResponse) {
  return anuncio.activo && anuncio.fecha_vencimiento.slice(0, 10) >= todayDate()
}

function formatShortDate(value: string) {
  return new Date(value.slice(0, 10) + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

const iconBtnClass =
  'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors'

// Spanish screen-reader messages for keyboard and pointer dragging.
const dndAccessibility = {
  screenReaderInstructions: {
    draggable:
      'Para mover un anuncio, presioná espacio o enter, usá las flechas para cambiar su lugar y presioná espacio o enter otra vez para soltarlo. Escape cancela.',
  },
  announcements: {
    onDragStart: () => 'Anuncio tomado.',
    onDragOver: () => 'Anuncio movido.',
    onDragEnd: () => 'Anuncio soltado.',
    onDragCancel: () => 'Movimiento cancelado.',
  },
}

interface AnuncioCardProps {
  anuncio: AnuncioResponse
  index: number
  total: number
  enInicio: boolean
  saving: boolean
  onMove: (index: number, delta: -1 | 1) => void
  onEdit: (anuncio: AnuncioResponse) => void
  onDelete: (anuncio: AnuncioResponse) => void
}

function AnuncioCard({ anuncio, index, total, enInicio, saving, onMove, onEdit, onDelete }: AnuncioCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: anuncio.id,
    disabled: saving,
  })
  const vigente = isVigente(anuncio)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex flex-wrap md:flex-nowrap items-center gap-x-3 gap-y-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm ${
        isDragging ? 'z-10 shadow-xl ring-2 ring-primary/40' : ''
      }`}
    >
      {/* Drag handle with the position number. Phones: bottom row, left. */}
      <div className="order-2 md:order-none flex shrink-0 items-center gap-1 md:flex-col md:gap-0">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold">
          {index + 1}
        </span>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={saving}
          className={`${iconBtnClass} touch-none cursor-grab active:cursor-grabbing`}
          aria-label={`Arrastrar "${anuncio.titulo}" para cambiar el orden`}
        >
          <GripVertical className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Same tile the jugador sees on the home, then the text. Phones: full-width first row. */}
      <div className="order-1 md:order-none w-full md:w-auto min-w-0 md:flex-1 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        <AnuncioBanner src={anuncio.imagen_url} alt={anuncio.titulo} dimmed={!vigente} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white break-words line-clamp-1">{anuncio.titulo}</h3>
          {anuncio.descripcion ? (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300 break-words line-clamp-2">{anuncio.descripcion}</p>
          ) : (
            <p className="mt-0.5 text-sm italic text-slate-400 dark:text-slate-500">Sin descripción</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {enInicio ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
                En el inicio
              </span>
            ) : vigente ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                Fuera del inicio
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                {anuncio.activo ? 'Vencido' : 'Pausado'}
              </span>
            )}
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300">
              Vence {formatShortDate(anuncio.fecha_vencimiento)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions: phones put them on the bottom row, right; desktop a 2x2 grid. Arrows are the alternative to dragging. */}
      <div className="order-3 md:order-none ml-auto flex md:grid md:grid-cols-2">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={saving || index === 0}
          className={iconBtnClass}
          aria-label={`Subir "${anuncio.titulo}"`}
        >
          <ArrowUp className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(anuncio)}
          className={`${iconBtnClass} order-3 md:order-none`}
          aria-label={`Editar "${anuncio.titulo}"`}
        >
          <Pencil className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={saving || index === total - 1}
          className={`${iconBtnClass} order-2 md:order-none`}
          aria-label={`Bajar "${anuncio.titulo}"`}
        >
          <ArrowDown className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(anuncio)}
          className="order-4 md:order-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          aria-label={`Eliminar "${anuncio.titulo}"`}
        >
          <Trash2 className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

function EditarAnuncioModal({
  anuncio,
  onClose,
  onSaved,
}: {
  anuncio: AnuncioResponse
  onClose: () => void
  onSaved: (anuncio: AnuncioResponse) => void
}) {
  const [titulo, setTitulo] = useState(anuncio.titulo)
  const [descripcion, setDescripcion] = useState(anuncio.descripcion ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!titulo.trim() || saving) return
    try {
      setSaving(true)
      setError('')
      onSaved(await actualizarAnuncio(anuncio.id, { titulo: titulo.trim(), descripcion: descripcion.trim() }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el anuncio')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Editar anuncio"
      onClose={onClose}
      busy={saving}
      wide
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnCls}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !titulo.trim()} className={primaryBtnCls}>
            {saving && <Spinner />}
            Guardar
          </button>
        </>
      }
    >
      <div>
        <p className={labelCls}>Así se ve en el inicio</p>
        <AnuncioBanner src={anuncio.imagen_url} alt={anuncio.titulo} />
      </div>
      <div>
        <label htmlFor="editar-titulo" className={labelCls}>
          Título
        </label>
        <input id="editar-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label htmlFor="editar-descripcion" className={labelCls}>
          Descripción (opcional)
        </label>
        <textarea
          id="editar-descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={5}
          className={`${inputCls} h-auto py-2 resize-none`}
        />
      </div>
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function AnunciosSection() {
  const [anuncios, setAnuncios] = useState<AnuncioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AnuncioResponse | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const fetchAnuncios = async () => {
    try {
      setError('')
      setAnuncios(await getAnunciosClub())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los anuncios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnuncios()
  }, [])

  // Shows the new order right away and rolls back if the server rejects it.
  const saveOrder = async (next: AnuncioResponse[]) => {
    const previous = anuncios
    setAnuncios(next)
    setSaving(true)
    setError('')
    try {
      setAnuncios(await reordenarAnuncios(next.map((anuncio) => anuncio.id)))
    } catch (err) {
      setAnuncios(previous)
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el orden')
    } finally {
      setSaving(false)
    }
  }

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (saving || target < 0 || target >= anuncios.length) return
    saveOrder(arrayMove(anuncios, index, target))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (saving || !over || active.id === over.id) return
    const from = anuncios.findIndex((anuncio) => anuncio.id === active.id)
    const to = anuncios.findIndex((anuncio) => anuncio.id === over.id)
    if (from < 0 || to < 0) return
    saveOrder(arrayMove(anuncios, from, to))
  }

  const handleDelete = async (anuncio: AnuncioResponse) => {
    const ok = window.confirm(`¿Eliminar el anuncio "${anuncio.titulo}"?`)
    if (!ok) return

    try {
      await eliminarAnuncio(anuncio.id)
      setAnuncios((prev) => prev.filter((item) => item.id !== anuncio.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el anuncio')
    }
  }

  // Position each vigente announcement takes on the jugador home.
  const inicioPosition = new Map<string, number>()
  anuncios.filter(isVigente).forEach((anuncio, i) => inicioPosition.set(anuncio.id, i))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Publicá anuncios para que los jugadores los vean en su inicio y elegí en qué orden aparecen.
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={`${primaryBtnCls} shrink-0`}>
          <Plus className="w-5 h-5" aria-hidden="true" />
          Nuevo anuncio
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Orden en el inicio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Arrastrá un anuncio desde <GripVertical className="inline w-3.5 h-3.5 align-text-bottom" aria-hidden="true" /> o
            usá las flechas. El primero de la lista es el primero que ven los jugadores. En el inicio se muestran hasta{' '}
            {INICIO_MAX} anuncios vigentes.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : anuncios.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <Megaphone className="w-9 h-9 text-slate-400 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Todavía no hay anuncios</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={dndAccessibility}
          >
            <SortableContext items={anuncios.map((anuncio) => anuncio.id)} strategy={verticalListSortingStrategy}>
              <ol className="space-y-3" aria-busy={saving}>
                {anuncios.map((anuncio, index) => {
                  const posicionInicio = inicioPosition.get(anuncio.id)
                  return (
                    <AnuncioCard
                      key={anuncio.id}
                      anuncio={anuncio}
                      index={index}
                      total={anuncios.length}
                      enInicio={posicionInicio !== undefined && posicionInicio < INICIO_MAX}
                      saving={saving}
                      onMove={move}
                      onEdit={setEditing}
                      onDelete={handleDelete}
                    />
                  )
                })}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {creating && (
        <AnuncioWizard
          onClose={() => setCreating(false)}
          onCreated={(nuevo) => {
            setAnuncios((prev) => [nuevo, ...prev])
            setCreating(false)
          }}
        />
      )}

      {editing && (
        <EditarAnuncioModal
          anuncio={editing}
          onClose={() => setEditing(null)}
          onSaved={(actualizado) => {
            setAnuncios((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
