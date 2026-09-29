'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  actualizarPuntosRecompensa,
  crearPuntosRecompensa,
  eliminarPuntosRecompensa,
  getPuntosCategorias,
  getPuntosRecompensasAdmin,
  subirImagenRecompensa,
  type PuntosCategoria,
  type PuntosRecompensa,
} from '@/lib/api'
import SafeImage from '@/components/ui/SafeImage'
import ImageCropper from '@/components/ui/ImageCropper'
import {
  ConfirmModal,
  ErrorNote,
  Modal,
  Pill,
  Spinner,
  Toggle,
  cardCls,
  errMsg,
  fmt,
  inputCls,
  labelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './ui'

const MAX_COSTO = 10_000_000
const MAX_DESC = 500

function stockLabel(stock: number | null): string {
  if (stock === null) return 'Sin límite'
  if (stock <= 0) return 'Agotada'
  return `Quedan ${fmt(stock)}`
}

function Thumb({ src, className }: { src: string | null; className: string }) {
  return <SafeImage src={src} icon="redeem" className={`${className} object-cover`} />
}

function RecompensaModal({
  item,
  categorias,
  onClose,
  onSaved,
}: {
  item: PuntosRecompensa | null
  categorias: PuntosCategoria[]
  onClose: () => void
  onSaved: () => void
}) {
  const [titulo, setTitulo] = useState(item?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '')
  const [categoriaId, setCategoriaId] = useState(item?.categoria_id ?? '')
  const [costo, setCosto] = useState(item ? String(item.costo_puntos) : '')
  const [ilimitado, setIlimitado] = useState(item ? item.stock === null : true)
  const [stock, setStock] = useState(item && item.stock !== null ? String(item.stock) : '')
  const [activo, setActivo] = useState(item?.activo ?? true)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [cropSource, setCropSource] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    []
  )

  const shownImage = preview ?? item?.imagen_url ?? null
  const costoNum = /^\d+$/.test(costo.trim()) ? Number(costo) : NaN
  const catName = categorias.find(c => c.id === categoriaId)?.nombre

  const save = async () => {
    const name = titulo.trim()
    if (!name) return setError('Ingresá un título para la recompensa.')
    if (name.length > 80) return setError('El título admite hasta 80 caracteres.')
    if (descripcion.length > MAX_DESC) return setError(`La descripción admite hasta ${MAX_DESC} caracteres.`)
    if (!Number.isFinite(costoNum) || costoNum < 1 || costoNum > MAX_COSTO) {
      return setError(`El costo debe ser un número entero entre 1 y ${fmt(MAX_COSTO)}.`)
    }
    if (!ilimitado && !/^\d+$/.test(stock.trim())) return setError('El stock debe ser un número entero (0 o más).')
    setError('')
    setSaving(true)
    try {
      let imagenUrl: string | undefined
      if (pickedFile) imagenUrl = await subirImagenRecompensa(pickedFile)
      const input = {
        titulo: name,
        descripcion: descripcion.trim(),
        costo_puntos: costoNum,
        stock: ilimitado ? null : Number(stock),
        categoria_id: categoriaId || null,
        activo,
        ...(imagenUrl ? { imagen_url: imagenUrl } : {}),
      }
      if (item) await actualizarPuntosRecompensa(item.id, input)
      else await crearPuntosRecompensa(input)
      onSaved()
    } catch (e) {
      setError(errMsg(e, 'No pudimos guardar la recompensa.'))
      setSaving(false)
    }
  }

  return (
    <>
      <Modal
        title={item ? 'Editar recompensa' : 'Nueva recompensa'}
        onClose={onClose}
        busy={saving}
        suspended={cropSource !== null}
        wide
        footer={
          <>
            <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnCls}>
              Cancelar
            </button>
            <button type="button" onClick={save} disabled={saving} className={primaryBtnCls}>
              {saving && <Spinner />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div>
          <span className={labelCls}>Imagen</span>
          <div className="flex items-center gap-4">
            <Thumb src={shownImage} className="size-28 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) setCropSource(f)
                  e.target.value = ''
                }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} className={secondaryBtnCls}>
                <span className="material-symbols-outlined">add_photo_alternate</span>
                {shownImage ? 'Cambiar imagen' : 'Elegir imagen'}
              </button>
              <p className="text-sm text-slate-500 dark:text-slate-400">JPG, PNG o WEBP. Se recorta cuadrada.</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="rec-titulo" className={labelCls}>
            Título
          </label>
          <input
            id="rec-titulo"
            value={titulo}
            maxLength={80}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej: Gaseosa 500 ml"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="rec-desc" className={labelCls}>
            Descripción (opcional)
          </label>
          <textarea
            id="rec-desc"
            value={descripcion}
            maxLength={MAX_DESC}
            rows={3}
            onChange={e => setDescripcion(e.target.value)}
            className={`${inputCls} !h-auto py-2`}
          />
          <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
            {descripcion.length}/{MAX_DESC}
          </p>
        </div>

        <div>
          <label htmlFor="rec-cat" className={labelCls}>
            Categoría
          </label>
          <select id="rec-cat" value={categoriaId} onChange={e => setCategoriaId(e.target.value)} className={inputCls}>
            <option value="">Sin categoría</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {categorias.length === 0 && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Todavía no hay categorías. Podés crearlas en la pestaña Categorías.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="rec-costo" className={labelCls}>
            Costo en puntos
          </label>
          <input
            id="rec-costo"
            inputMode="numeric"
            value={costo}
            onChange={e => setCosto(e.target.value)}
            placeholder="500"
            className={inputCls}
          />
        </div>

        <div className="space-y-2">
          <Toggle checked={ilimitado} onChange={setIlimitado} label="Sin límite de stock" />
          {!ilimitado && (
            <div>
              <label htmlFor="rec-stock" className={labelCls}>
                Unidades disponibles
              </label>
              <input
                id="rec-stock"
                inputMode="numeric"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="10"
                className={inputCls}
              />
            </div>
          )}
        </div>

        <Toggle checked={activo} onChange={setActivo} label="Recompensa activa" />

        <div>
          <span className={labelCls}>Así la va a ver el jugador</span>
          <div className="w-40 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900">
            <Thumb src={shownImage} className="aspect-square w-full" />
            <div className="p-2">
              <p className="line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{titulo.trim() || 'Título'}</p>
              {catName && <p className="text-xs text-slate-500 dark:text-slate-400">{catName}</p>}
              <p className="text-base font-semibold text-primary">
                {Number.isFinite(costoNum) ? fmt(costoNum) : '0'} puntos
              </p>
            </div>
          </div>
        </div>

        <ErrorNote message={error} />
      </Modal>

      {cropSource && (
        <ImageCropper
          file={cropSource}
          onCancel={() => setCropSource(null)}
          onConfirm={(file, url) => {
            if (previewRef.current) URL.revokeObjectURL(previewRef.current)
            previewRef.current = url
            setPreview(url)
            setPickedFile(file)
            setCropSource(null)
          }}
        />
      )}
    </>
  )
}

export default function RecompensasSection() {
  const [items, setItems] = useState<PuntosRecompensa[]>([])
  const [categorias, setCategorias] = useState<PuntosCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState<PuntosRecompensa | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PuntosRecompensa | null>(null)
  const [delBusy, setDelBusy] = useState(false)
  const [delError, setDelError] = useState('')

  const load = useCallback(async () => {
    try {
      const [recs, cats] = await Promise.all([getPuntosRecompensasAdmin(), getPuntosCategorias()])
      setItems(recs)
      setCategorias(cats)
      setLoadError('')
    } catch (e) {
      setLoadError(errMsg(e, 'No pudimos cargar las recompensas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleting) return
    setDelBusy(true)
    setDelError('')
    try {
      await eliminarPuntosRecompensa(deleting.id)
      setDeleting(null)
      await load()
    } catch (e) {
      setDelError(errMsg(e, 'No pudimos eliminar la recompensa.'))
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-slate-500 dark:text-slate-400">
          Premios que los jugadores pueden canjear con sus puntos.
        </p>
        <button type="button" onClick={() => setEditing('new')} className={`${primaryBtnCls} w-full sm:w-auto`}>
          <span className="material-symbols-outlined">add</span>
          Nueva recompensa
        </button>
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : loadError ? (
        <ErrorNote message={loadError} />
      ) : items.length === 0 ? (
        <p className={`${cardCls} text-center text-base text-slate-500 dark:text-slate-400`}>
          Todavía no creaste recompensas.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(r => (
            <li key={r.id} className={`${cardCls} flex items-center gap-3`}>
              <Thumb src={r.imagen_url} className="size-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-base font-bold text-slate-900 dark:text-white">{r.titulo}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{r.categoria_nombre ?? 'Sin categoría'}</p>
                <p className="text-base font-semibold text-primary">{fmt(r.costo_puntos)} puntos</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{stockLabel(r.stock)}</span>
                  <Pill active={r.activo} />
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  aria-label={`Editar ${r.titulo}`}
                  onClick={() => setEditing(r)}
                  className="flex size-12 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${r.titulo}`}
                  onClick={() => {
                    setDelError('')
                    setDeleting(r)
                  }}
                  className="flex size-12 items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <RecompensaModal
          item={editing === 'new' ? null : editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Eliminar recompensa"
          message={`¿Eliminar "${deleting.titulo}"? Los canjes que ya se hicieron no se modifican.`}
          confirmLabel="Eliminar"
          busy={delBusy}
          error={delError}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}
