'use client'

import { useEffect, useState } from 'react'
import {
  normalizeRankingTorneosPuntos,
  type RankingEquipoPuntos,
  type RankingPuntosResponse,
  type RankingTorneoPuntos,
} from '@/lib/api'

export type RankingStreamStatus = 'connecting' | 'live' | 'offline'

const BACKOFF_MS = [1000, 2000, 5000, 10000]
const DEAD_AFTER_MS = 60_000
const HIGHLIGHT_MS = 1500

// Sort by total desc then name asc, and assign standard competition ranking
// (ties share the position, the next position skips).
function rankEquipos(equipos: RankingEquipoPuntos[]): RankingEquipoPuntos[] {
  const sorted = [...equipos].sort(
    (a, b) => b.total - a.total || a.equipo_nombre.localeCompare(b.equipo_nombre, 'es')
  )
  return sorted.map(e => ({ ...e, posicion: 1 + sorted.filter(o => o.total > e.total).length }))
}

function applyRankingUpdate(
  prev: RankingPuntosResponse | null,
  torneoId: string,
  torneoEquipoId: string,
  total: number
): RankingPuntosResponse | null {
  if (!prev) return prev
  const torneos: RankingTorneoPuntos[] = prev.torneos.map(t => {
    if (t.torneo_id !== torneoId) return t
    if (!t.equipos.some(e => e.torneo_equipo_id === torneoEquipoId)) return t
    return {
      ...t,
      equipos: rankEquipos(t.equipos.map(e => (e.torneo_equipo_id === torneoEquipoId ? { ...e, total } : e))),
    }
  })
  return { ...prev, torneos }
}

interface SseFrame {
  event: string
  data: string
}

function parseFrame(raw: string): SseFrame | null {
  let event = 'message'
  const data: string[] = []
  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue
    const idx = line.indexOf(':')
    const field = idx === -1 ? line : line.slice(0, idx)
    const value = idx === -1 ? '' : line.slice(idx + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
  }
  return data.length || event !== 'message' ? { event, data: data.join('\n') } : null
}

export function useRankingStream() {
  const [ranking, setRanking] = useState<RankingPuntosResponse | null>(null)
  const [status, setStatus] = useState<RankingStreamStatus>('connecting')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    let disposed = false
    let controller: AbortController | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let deadTimer: ReturnType<typeof setTimeout> | undefined
    let highlightTimer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    const handleFrame = (frame: SseFrame) => {
      if (frame.event === 'ping') return
      let payload: unknown
      try {
        payload = frame.data ? JSON.parse(frame.data) : {}
      } catch {
        return
      }
      if (!payload || typeof payload !== 'object') return
      const p = payload as Record<string, unknown>

      if (frame.event === 'snapshot') {
        attempt = 0
        setRanking({
          torneos: normalizeRankingTorneosPuntos(p.torneos),
          actualizado_at: typeof p.actualizado_at === 'string' ? p.actualizado_at : null,
        })
        setLastUpdate(new Date())
      } else if (frame.event === 'ranking') {
        const torneoId = String(p.torneo_id ?? '')
        const equipoId = String(p.torneo_equipo_id ?? '')
        const total = Number(p.total_equipo)
        if (!torneoId || !equipoId || Number.isNaN(total)) return
        setRanking(prev => applyRankingUpdate(prev, torneoId, equipoId, total))
        setLastUpdate(new Date())
        setHighlightId(equipoId)
        clearTimeout(highlightTimer)
        highlightTimer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS)
      }
    }

    const stop = () => {
      clearTimeout(retryTimer)
      clearTimeout(deadTimer)
      controller?.abort()
      controller = null
    }

    const connect = async () => {
      if (disposed || controller) return
      const ctrl = new AbortController()
      controller = ctrl
      let unauthorized = false

      const armDeadTimer = () => {
        clearTimeout(deadTimer)
        deadTimer = setTimeout(() => ctrl.abort(), DEAD_AFTER_MS)
      }

      try {
        const token = localStorage.getItem('token')
        armDeadTimer()
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/puntos/ranking/stream`, {
          headers: {
            Accept: 'text/event-stream',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
          signal: ctrl.signal,
        })
        if (res.status === 401) {
          unauthorized = true
          throw new Error('unauthorized')
        }
        if (!res.ok || !res.body) throw new Error('stream unavailable')

        setStatus('live')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          armDeadTimer()
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, '\n')
          const frames = buffer.split('\n\n')
          buffer = frames.pop() ?? ''
          for (const raw of frames) {
            const frame = parseFrame(raw)
            if (frame) handleFrame(frame)
          }
        }
      } catch {
        // Handled below: reconnect, pause or give up
      }

      clearTimeout(deadTimer)
      // Superseded by pause/unmount: nothing else to do
      if (controller !== ctrl) return
      controller = null
      if (disposed) return
      setStatus('offline')
      if (unauthorized) return
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
      attempt += 1
      retryTimer = setTimeout(connect, delay)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop()
      } else if (!controller) {
        attempt = 0
        clearTimeout(retryTimer)
        setStatus('connecting')
        connect()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    if (document.visibilityState !== 'hidden') connect()

    return () => {
      disposed = true
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(highlightTimer)
      stop()
    }
  }, [])

  return { ranking, status, lastUpdate, highlightId }
}
