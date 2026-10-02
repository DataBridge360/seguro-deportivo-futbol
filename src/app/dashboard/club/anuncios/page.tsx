'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Megaphone, Trash2 } from 'lucide-react'
import SafeImage from '@/components/ui/SafeImage'
import AnuncioWizard from '@/components/anuncios/AnuncioWizard'
import { AnuncioResponse, eliminarAnuncio, getAnunciosClub, reordenarAnuncios } from '@/lib/api'

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

export default function ClubAnunciosPage() {
  const [anuncios, setAnuncios] = useState<AnuncioResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (saving || target < 0 || target >= anuncios.length) return

    const previous = anuncios
    const next = anuncios.slice()
    ;[next[index], next[target]] = [next[target], next[index]]

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

  const handleDelete = async (id: string) => {
    const ok = window.confirm('¿Eliminar este anuncio?')
    if (!ok) return

    try {
      await eliminarAnuncio(id)
      setAnuncios((prev) => prev.filter((anuncio) => anuncio.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el anuncio')
    }
  }

  // Position each vigente announcement takes on the jugador home.
  const inicioPosition = new Map<string, number>()
  anuncios.filter(isVigente).forEach((anuncio, i) => inicioPosition.set(anuncio.id, i))

  const arrowClass =
    'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/10 disabled:opacity-30 disabled:pointer-events-none transition-colors'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Anuncios</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Publicá anuncios para que los jugadores los vean en su inicio y elegí en qué orden aparecen.
        </p>
      </div>

      <AnuncioWizard onCreated={(nuevo) => setAnuncios((prev) => [nuevo, ...prev])} />

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Orden en el inicio</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            El primero de la lista es el primero que ven los jugadores. En el inicio se muestran hasta {INICIO_MAX}{' '}
            anuncios vigentes.
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
          <ol className="space-y-2" aria-busy={saving}>
            {anuncios.map((anuncio, index) => {
              const vigente = isVigente(anuncio)
              const posicionInicio = inicioPosition.get(anuncio.id)
              const enInicio = posicionInicio !== undefined && posicionInicio < INICIO_MAX
              return (
                <li
                  key={anuncio.id}
                  className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 pr-1 shadow-sm"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-bold">
                    {index + 1}
                  </span>
                  {/* Mobile: banner on top of the text. Desktop: thumbnail beside it. */}
                  <div className="min-w-0 flex-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <SafeImage
                      src={anuncio.imagen_url}
                      alt={anuncio.titulo}
                      icon="campaign"
                      className={`w-full sm:w-40 aspect-[3.2/1] shrink-0 rounded-lg object-cover ${vigente ? '' : 'opacity-50 grayscale'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 sm:line-clamp-1">{anuncio.titulo}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
                  <div className="flex shrink-0 items-center">
                    <div className="flex flex-col sm:flex-row">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={saving || index === 0}
                        className={arrowClass}
                        aria-label={`Subir "${anuncio.titulo}"`}
                      >
                        <ArrowUp className="w-5 h-5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={saving || index === anuncios.length - 1}
                        className={arrowClass}
                        aria-label={`Bajar "${anuncio.titulo}"`}
                      >
                        <ArrowDown className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(anuncio.id)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      aria-label={`Eliminar "${anuncio.titulo}"`}
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
