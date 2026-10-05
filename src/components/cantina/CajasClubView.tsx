'use client'

import { useEffect, useState } from 'react'
import { getCantinasCaja, getPuntosConfig, type CantinaCaja } from '@/lib/api'
import CajaHistorial from '@/components/cantina/CajaHistorial'
import RegistrarCompraWizard from '@/components/cantina/RegistrarCompraWizard'
import EntregarRecompensaModal from '@/components/cantina/EntregarRecompensaModal'
import { Modal } from '@/components/club/puntos/ui'
import { useAuthStore } from '@/stores/authStore'

// Selected cantina chip ('' = Todas), stored per logged-in user
function selectionKey(): string {
  const userId = useAuthStore.getState().user?.id
  return `caja-cantina:${userId ? String(userId) : 'anon'}`
}

// Last cantina that charged, stored per logged-in user (default for the next sale)
function cobroKey(): string {
  const userId = useAuthStore.getState().user?.id
  return `caja-cobrar-cantina:${userId ? String(userId) : 'anon'}`
}

export default function CajasClubView() {
  const [cantinas, setCantinas] = useState<CantinaCaja[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storedSelected, setStoredSelected] = useState('')
  const [puntosActivos, setPuntosActivos] = useState(false)
  const [lastCobroId, setLastCobroId] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [cobroCantina, setCobroCantina] = useState<CantinaCaja | null>(null)
  const [showEntregar, setShowEntregar] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Read after mount to avoid hydration mismatches; only written on user click
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(selectionKey())
      if (typeof v === 'string') setStoredSelected(v)
      const last = window.localStorage.getItem(cobroKey())
      if (typeof last === 'string') setLastCobroId(last)
    } catch {
      // Storage unavailable: keep the default
    }
  }, [])

  // If the stored cantina no longer exists, fall back to Todas
  const selected = cantinas.some((c) => c.id === storedSelected) ? storedSelected : ''

  const select = (id: string) => {
    setStoredSelected(id)
    try {
      window.localStorage.setItem(selectionKey(), id)
    } catch {
      // Best-effort persistence
    }
  }

  useEffect(() => {
    let cancelled = false
    getCantinasCaja()
      .then((list) => {
        if (!cancelled) setCantinas(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No pudimos cargar las cantinas')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    getPuntosConfig()
      .then((cfg) => setPuntosActivos(!!cfg?.activo))
      .catch(() => setPuntosActivos(false))
  }, [])

  const activas = cantinas.filter((c) => c.activo)
  // Remembered cantina first, so the default is the top card
  const activasOrdenadas = [...activas].sort((a, b) => Number(b.id === lastCobroId) - Number(a.id === lastCobroId))

  const startCobro = (c: CantinaCaja) => {
    setLastCobroId(c.id)
    try {
      window.localStorage.setItem(cobroKey(), c.id)
    } catch {
      // Best-effort persistence
    }
    setPickerOpen(false)
    setCobroCantina(c)
  }

  // With a single active cantina there is nothing to choose
  const handleCobrar = () => {
    if (activas.length === 1) startCobro(activas[0])
    else setPickerOpen(true)
  }

  const chipClass = (active: boolean) =>
    `min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cajas de las cantinas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Mirá las ventas de cada cantina por separado o de todas juntas.
        </p>
      </div>

      <div className="mx-auto grid max-w-md gap-3 lg:mx-0">
        <button
          type="button"
          onClick={handleCobrar}
          disabled={loading || activas.length === 0}
          className="flex min-h-[88px] w-full items-center justify-center gap-3 rounded-2xl bg-primary text-xl font-bold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-4xl">point_of_sale</span>
          Cobrar
        </button>
        <button
          type="button"
          onClick={() => setShowEntregar(true)}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-white text-base font-semibold text-primary transition active:scale-[0.98] hover:bg-primary/5 dark:bg-slate-800"
        >
          <span className="material-symbols-outlined text-2xl">redeem</span>
          Recompensas
        </button>
        {!loading && !error && cantinas.length > 0 && activas.length === 0 && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No hay cantinas activas para cobrar. Activá una desde la sección de cantinas.
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex gap-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 w-28 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : cantinas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">storefront</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Todavía no hay cantinas en el club</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Elegir cantina">
            <button type="button" onClick={() => select('')} aria-pressed={selected === ''} className={chipClass(selected === '')}>
              Todas
            </button>
            {cantinas.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => select(c.id)}
                aria-pressed={selected === c.id}
                className={chipClass(selected === c.id)}
              >
                {c.nombre}
                {!c.activo && ' (inactiva)'}
              </button>
            ))}
          </div>
          <CajaHistorial cantinaId={selected || undefined} showCantina={!selected} refreshKey={refreshKey} />
        </>
      )}

      {pickerOpen && (
        <Modal title="¿Qué cantina cobra?" onClose={() => setPickerOpen(false)}>
          <ul className="space-y-3">
            {activasOrdenadas.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => startCobro(c)}
                  className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/70 transition active:scale-[0.98] dark:bg-slate-800 dark:ring-white/10"
                >
                  <span className="material-symbols-outlined text-3xl text-primary">storefront</span>
                  <span className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-900 dark:text-white">{c.nombre}</span>
                  {c.id === lastCobroId && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">Última</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      <RegistrarCompraWizard
        isOpen={!!cobroCantina}
        onClose={() => setCobroCantina(null)}
        puntosActivos={puntosActivos}
        cantinaId={cobroCantina?.id}
        cantinaNombre={cobroCantina?.nombre}
        onCompleted={() => setRefreshKey((k) => k + 1)}
      />
      <EntregarRecompensaModal isOpen={showEntregar} onClose={() => setShowEntregar(false)} />
    </div>
  )
}
