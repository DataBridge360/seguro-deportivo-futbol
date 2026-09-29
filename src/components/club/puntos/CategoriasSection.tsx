'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  actualizarPuntosCategoria,
  crearPuntosCategoria,
  eliminarPuntosCategoria,
  getPuntosCategorias,
  type PuntosCategoria,
} from '@/lib/api'
import {
  ConfirmModal,
  ErrorNote,
  Modal,
  Pill,
  Spinner,
  Toggle,
  cardCls,
  errMsg,
  inputCls,
  labelCls,
  primaryBtnCls,
  secondaryBtnCls,
} from './ui'

const ICONS = [
  'local_cafe',
  'lunch_dining',
  'sports_soccer',
  'checkroom',
  'confirmation_number',
  'local_drink',
  'icecream',
  'sports',
  'redeem',
  'star',
  'shopping_bag',
  'card_giftcard',
]

function CategoriaModal({
  item,
  onClose,
  onSaved,
}: {
  item: PuntosCategoria | null
  onClose: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(item?.nombre ?? '')
  const [icono, setIcono] = useState(item?.icono ?? 'redeem')
  const [activo, setActivo] = useState(item?.activo ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    const name = nombre.trim()
    if (!name) return setError('Ingresá un nombre para la categoría.')
    if (name.length > 40) return setError('El nombre admite hasta 40 caracteres.')
    setError('')
    setSaving(true)
    try {
      const input = { nombre: name, icono, activo }
      if (item) await actualizarPuntosCategoria(item.id, input)
      else await crearPuntosCategoria(input)
      onSaved()
    } catch (e) {
      setError(errMsg(e, 'No pudimos guardar la categoría.'))
      setSaving(false)
    }
  }

  return (
    <Modal
      title={item ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
      busy={saving}
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
        <label htmlFor="cat-nombre" className={labelCls}>
          Nombre
        </label>
        <input
          id="cat-nombre"
          value={nombre}
          maxLength={40}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Bebidas"
          className={inputCls}
        />
      </div>
      <div>
        <span className={labelCls}>Ícono</span>
        <div className="grid grid-cols-4 gap-2">
          {ICONS.map(ic => (
            <button
              key={ic}
              type="button"
              aria-label={ic}
              aria-pressed={icono === ic}
              onClick={() => setIcono(ic)}
              className={`flex h-14 items-center justify-center rounded-xl border-2 transition-colors ${
                icono === ic
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-3xl">{ic}</span>
            </button>
          ))}
        </div>
      </div>
      <Toggle checked={activo} onChange={setActivo} label="Categoría activa" />
      <ErrorNote message={error} />
    </Modal>
  )
}

export default function CategoriasSection() {
  const [items, setItems] = useState<PuntosCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState<PuntosCategoria | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PuntosCategoria | null>(null)
  const [delBusy, setDelBusy] = useState(false)
  const [delError, setDelError] = useState('')

  const load = useCallback(async () => {
    try {
      setItems(await getPuntosCategorias())
      setLoadError('')
    } catch (e) {
      setLoadError(errMsg(e, 'No pudimos cargar las categorías.'))
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
      await eliminarPuntosCategoria(deleting.id)
      setDeleting(null)
      await load()
    } catch (e) {
      setDelError(errMsg(e, 'No pudimos eliminar la categoría.'))
    } finally {
      setDelBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-slate-500 dark:text-slate-400">
          Agrupá las recompensas para que el jugador las encuentre más fácil.
        </p>
        <button type="button" onClick={() => setEditing('new')} className={`${primaryBtnCls} w-full sm:w-auto`}>
          <span className="material-symbols-outlined">add</span>
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      ) : loadError ? (
        <ErrorNote message={loadError} />
      ) : items.length === 0 ? (
        <p className={`${cardCls} text-center text-base text-slate-500 dark:text-slate-400`}>
          Todavía no creaste categorías.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(c => (
            <li key={c.id} className={`${cardCls} flex items-center gap-3`}>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-3xl">{c.icono || 'redeem'}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-slate-900 dark:text-white">{c.nombre}</p>
                <Pill active={c.activo} />
              </div>
              <button
                type="button"
                aria-label={`Editar ${c.nombre}`}
                onClick={() => setEditing(c)}
                className="flex size-12 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button
                type="button"
                aria-label={`Eliminar ${c.nombre}`}
                onClick={() => {
                  setDelError('')
                  setDeleting(c)
                }}
                className="flex size-12 items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <CategoriaModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
      {deleting && (
        <ConfirmModal
          title="Eliminar categoría"
          message={`¿Eliminar la categoría "${deleting.nombre}"? Las recompensas que la usan no se borran: quedan sin categoría.`}
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
