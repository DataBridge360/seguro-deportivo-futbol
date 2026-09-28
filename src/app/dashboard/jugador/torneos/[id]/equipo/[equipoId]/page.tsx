'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import {
  getJugadorTorneos, getJugadorInscripciones, getEquiposTorneo,
  agregarJugadorPorDelegado, quitarJugadorPorDelegado,
  buscarJugadorPorDni, desinscribirseEquipo,
} from '@/lib/api'
import type { JugadorBusqueda } from '@/lib/api'
import type { JugadorTorneo, JugadorInscripcion } from '@/lib/api'
import type { EquipoTorneoConVisibilidad } from '@/types/torneos-visibilidad'
import NotificationModal from '@/components/ui/NotificationModal'
import { useAuthStore } from '@/stores/authStore'
import { formatDateOnly, matchesSearch } from '@/lib/utils'

const WHATSAPP_NUMBER = '542996130664'
const DEFAULT_DEUDA_MESSAGE = 'Este equipo está inhabilitado por falta de pago. Regularizá la deuda para volver a acceder.'

// 12345678 -> 12.345.678
function formatDni(dni: string): string {
  const digits = dni.replace(/\D/g, '')
  if (digits.length < 7) return dni
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function isInscripcionAbierta(torneo: JugadorTorneo) {
  if (torneo.inscripciones_abiertas) return true
  const hoy = new Date().toISOString().split('T')[0]
  if (torneo.inscripcion_inicio && torneo.inscripcion_fin) {
    return hoy >= torneo.inscripcion_inicio && hoy <= torneo.inscripcion_fin
  }
  return false
}

export default function JugadorEquipoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const torneoId = params.id as string
  const equipoId = params.equipoId as string
  const { user } = useAuthStore()
  const jugadorId = user?.id

  const [torneo, setTorneo] = useState<JugadorTorneo | null>(null)
  const [equipo, setEquipo] = useState<EquipoTorneoConVisibilidad | null>(null)
  const [inscripciones, setInscripciones] = useState<JugadorInscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [busquedaRoster, setBusquedaRoster] = useState('')
  const [showConfirmSalir, setShowConfirmSalir] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  // Delegado: agregar/quitar jugadores
  const [showModalAgregar, setShowModalAgregar] = useState(false)
  const [dniInput, setDniInput] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<JugadorBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<JugadorBusqueda[]>([])
  const [agregando, setAgregando] = useState(false)
  const [quitandoId, setQuitandoId] = useState<string | null>(null)
  const [showConfirmQuitar, setShowConfirmQuitar] = useState<{ id: string; nombre: string } | null>(null)
  const [showEliminacionBloqueada, setShowEliminacionBloqueada] = useState(false)

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success',
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorCarga(null)
      const [torneosData, inscripcionesData, equiposData] = await Promise.all([
        getJugadorTorneos(),
        getJugadorInscripciones(),
        getEquiposTorneo(torneoId),
      ])
      const t = torneosData.find(t => t.id === torneoId)
      setTorneo(t || null)
      setInscripciones(inscripcionesData)
      const eq = equiposData.find(e => e.id === equipoId) as EquipoTorneoConVisibilidad | undefined
      setEquipo(eq || null)
    } catch (err: any) {
      // El backend responde 404 cuando el torneo/equipo pertenece a otro club.
      const message = /404|no encontrad/i.test(err.message || '')
        ? 'Este torneo o equipo no pertenece a tu club, o ya no está disponible.'
        : err.message || 'Error al cargar datos'
      setErrorCarga(message)
      setNotification({ open: true, title: 'Error', message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [torneoId, equipoId])

  // Portals need document.body, which only exists on the client.
  useEffect(() => { setMounted(true) }, [])

  // Búsqueda dinámica por DNI
  useEffect(() => {
    if (dniInput.length < 3) { setResultadosBusqueda([]); return }
    let cancelled = false
    const timeout = setTimeout(async () => {
      try {
        setBuscando(true)
        const res = await buscarJugadorPorDni(dniInput, torneoId)
        if (cancelled) return
        // Mostrar todos los resultados — los ya en equipo se marcan en el render
        const yaSeleccionados = new Set(jugadoresSeleccionados.map(j => j.id))
        setResultadosBusqueda((res ?? []).filter(j => !yaSeleccionados.has(j.id)))
      } catch (err: any) {
        if (cancelled) return
        setResultadosBusqueda([])
        setNotification({ open: true, title: 'Error al buscar', message: err.message || 'No se pudo buscar el jugador', type: 'error' })
      } finally {
        if (!cancelled) setBuscando(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timeout) }
  }, [dniInput, jugadoresSeleccionados])

  const misInscripcionesTorneo = inscripciones.filter(i => i.torneo_id === torneoId)
  // Fuente de verdad: el flag del backend. Fallback a la heurística previa
  // solo si la respuesta no lo trae (compatibilidad hacia atrás).
  const esMiEquipo = typeof equipo?.es_mi_equipo === 'boolean'
    ? equipo.es_mi_equipo
    : misInscripcionesTorneo.some(i => i.torneo_equipo_id === equipoId)
  const abierto = torneo ? isInscripcionAbierta(torneo) : false

  // Check if current user is delegado of this team. En equipos ajenos el
  // backend no envía jugador_id en delegados, así que esto solo puede dar
  // true en el propio equipo (dato completo de todas formas).
  const esDelegado = esMiEquipo && (equipo?.delegados?.some(d => d.jugador_id === jugadorId) ?? false)

  const handleQuitarJugador = async () => {
    if (!showConfirmQuitar) return
    if (equipo?.inhabilitado_por_deuda) return
    try {
      setQuitandoId(showConfirmQuitar.id)
      await quitarJugadorPorDelegado(torneoId, equipoId, showConfirmQuitar.id)
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Jugador quitado', message: `${showConfirmQuitar.nombre} fue quitado del equipo`, type: 'success' })
      await fetchData()
    } catch (err: any) {
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Error', message: err.message || 'No se pudo quitar al jugador', type: 'error' })
    } finally {
      setQuitandoId(null)
    }
  }

  const handleSalirEquipo = async () => {
    try {
      setSaliendo(true)
      await desinscribirseEquipo(torneoId, equipoId)
      router.push('/dashboard/jugador/torneos')
    } catch (err: any) {
      setShowConfirmSalir(false)
      setNotification({ open: true, title: 'No pudimos sacarte del equipo', message: err.message || 'No se pudo salir del equipo', type: 'error' })
      setSaliendo(false)
    }
  }

  const cerrarModalAgregar = () => {
    setShowModalAgregar(false)
    setDniInput('')
    setJugadoresSeleccionados([])
    setResultadosBusqueda([])
  }

  const handleRegularizarPago = () => {
    if (!equipo) return
    const mensaje = encodeURIComponent(
      `Hola, quiero regularizar el pago del equipo ${equipo.equipo_nombre} (${equipo.categoria_nombre}).`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank')
  }

  const loadLogoBase64 = async (src: string): Promise<string> => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      return await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch { return '' }
  }

  const handleDescargarPDF = async () => {
    if (!equipo) return
    // Guarda defensiva: la planilla solo puede descargarse para el equipo
    // propio (nunca para equipos ajenos, aunque el botón no debería
    // renderizarse en ese caso).
    if (!esMiEquipo) return
    try {
      setGenerandoPDF(true)
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const [logoLeft, logoCenter, logoRight] = await Promise.all([
        loadLogoBase64('/logos/lucas-segura.png'),
        loadLogoBase64('/logos/complejo-deportivo.png'),
        loadLogoBase64('/logos/bbva-seguros.png'),
      ])
      const hoy = new Date()
      const fecha = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`
      const logoLeftImg = logoLeft ? `<img src="${logoLeft}" style="height:48px;width:auto;">` : ''
      const logoCenterImg = logoCenter ? `<img src="${logoCenter}" style="height:80px;width:auto;">` : ''
      const logoRightImg = logoRight ? `<img src="${logoRight}" style="height:38px;width:auto;">` : ''
      const thStyle = 'color:#fff;font-weight:700;text-transform:uppercase;padding:5px 6px;text-align:center;font-size:9.5px;letter-spacing:0.3px;border:1px solid #2d2d2d;'
      const tdBase = 'padding:4px 6px;text-align:center;vertical-align:middle;border:1px solid #bbb;font-size:10px;'
      const marginMM = 12
      const contentWidthMM = 210 - marginMM * 2
      const maxContentHeightMM = 297 - marginMM * 2
      const renderWidthPx = 794

      const rows = equipo.jugadores.map((j) => `
        <tr>
          <td style="${tdBase}"></td>
          <td style="${tdBase}"></td>
          <td style="${tdBase}font-weight:700;text-transform:uppercase;">${`${(j.apellido || '').toUpperCase()} ${(j.nombre || '').toUpperCase()}`.trim()}</td>
          <td style="${tdBase}">${j.dni || '-'}</td>
          <td style="${tdBase}">${formatDateOnly(j.fecha_nacimiento)}</td>
          <td style="${tdBase}font-weight:700;">${equipo.categoria_nombre}</td>
          <td style="${tdBase}font-weight:700;text-transform:uppercase;">${equipo.equipo_nombre.toUpperCase()}</td>
        </tr>`).join('')

      const pageHtml = `
        <div style="font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; width: ${renderWidthPx}px; background: #fff;">
          <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:10px;">
            <tr>
              <td style="text-align:left;vertical-align:middle;border:none;width:33%;">${logoLeftImg}</td>
              <td style="text-align:center;vertical-align:middle;border:none;width:34%;">${logoCenterImg}</td>
              <td style="text-align:right;vertical-align:middle;border:none;width:33%;">${logoRightImg}</td>
            </tr>
          </table>
          <div style="font-size: 11px; margin-bottom: 4px;">FECHA: ${fecha}</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #2d2d2d;">
                <th style="${thStyle}width:50px;">ORDEN</th>
                <th style="${thStyle}width:25px;">N</th>
                <th style="${thStyle}">APELLIDO Y NOMBRE</th>
                <th style="${thStyle}width:75px;">DNI</th>
                <th style="${thStyle}width:95px;">F/NACIMIENTO</th>
                <th style="${thStyle}width:78px;">CATEGORÍA</th>
                <th style="${thStyle}width:85px;">EQUIPO</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`

      const container = document.createElement('div')
      container.innerHTML = pageHtml
      container.style.cssText = `position:fixed;left:0;top:0;width:${renderWidthPx}px;z-index:-9999;pointer-events:none;`
      document.body.appendChild(container)

      try {
        const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff' })
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
        // Slice the canvas into page-height chunks so long rosters span several pages.
        const pageHeightPx = Math.floor((maxContentHeightMM * canvas.width) / contentWidthMM)
        let offsetPx = 0
        let pageIndex = 0
        while (offsetPx < canvas.height) {
          const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetPx)
          const slice = document.createElement('canvas')
          slice.width = canvas.width
          slice.height = sliceHeightPx
          const ctx = slice.getContext('2d')
          if (!ctx) throw new Error('No se pudo preparar el PDF')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, slice.width, slice.height)
          ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
          if (pageIndex > 0) pdf.addPage()
          const sliceHeightMM = (sliceHeightPx * contentWidthMM) / canvas.width
          pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', marginMM, marginMM, contentWidthMM, sliceHeightMM)
          offsetPx += sliceHeightPx
          pageIndex += 1
        }
        const fileName = `${equipo.equipo_nombre.toLowerCase().replace(/\s+/g, '-')}-planilla.pdf`
        pdf.save(fileName)
        setNotification({ open: true, title: 'PDF generado', message: 'Descargado exitosamente', type: 'success' })
      } finally {
        document.body.removeChild(container)
      }
    } catch (error) {
      setNotification({ open: true, title: 'Error al generar PDF', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setGenerandoPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando equipo...</p>
        </div>
      </div>
    )
  }

  if (!equipo || !torneo) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">error</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {errorCarga || 'Equipo no encontrado'}
          </p>
        </div>
      </div>
    )
  }

  if (equipo.inhabilitado_por_deuda) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver al torneo
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-500/30 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-500 text-3xl">lock</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Equipo inhabilitado</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            {equipo.equipo_nombre} · {equipo.categoria_nombre}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {equipo.inhabilitado_motivo || DEFAULT_DEUDA_MESSAGE}
          </p>
          <button onClick={handleRegularizarPago} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-base font-semibold transition-colors">
            <span className="material-symbols-outlined text-lg">chat</span>
            Regularizar por WhatsApp
          </button>
        </div>
      </div>
    )
  }

  const puedeSalir = abierto && equipo.jugadores.some(j => j.id === jugadorId)
  const busquedaNorm = busquedaRoster.trim()
  const busquedaDigitos = busquedaRoster.replace(/\D/g, '')
  const jugadoresFiltrados = equipo.jugadores.filter(j => {
    if (!busquedaNorm) return true
    if (matchesSearch([j.apellido, j.nombre], busquedaNorm)) return true
    if (esDelegado && busquedaDigitos) return (j.dni ?? '').replace(/\D/g, '').includes(busquedaDigitos)
    return false
  })
  const cardClass = 'bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10'
  const secondaryBtn = 'px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-base font-bold transition-colors disabled:opacity-50'

  const handleConfirmarAgregar = async () => {
    if (jugadoresSeleccionados.length === 0) return
    try {
      setAgregando(true)
      const resultados = await Promise.allSettled(
        jugadoresSeleccionados.map(j => agregarJugadorPorDelegado(torneoId, equipoId, j.dni))
      )
      const exitosos = resultados.filter(r => r.status === 'fulfilled').length
      const rechazados = resultados.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      cerrarModalAgregar()
      if (rechazados.length === 0) {
        setNotification({ open: true, title: 'Jugadores agregados', message: `${exitosos} jugador${exitosos !== 1 ? 'es' : ''} agregado${exitosos !== 1 ? 's' : ''} al equipo`, type: 'success' })
      } else if (exitosos === 0) {
        const primerError = rechazados[0].reason?.message || 'No se pudo agregar los jugadores'
        setNotification({ open: true, title: 'Error al agregar', message: primerError, type: 'error' })
      } else {
        const primerError = rechazados[0].reason?.message || 'Error desconocido'
        setNotification({ open: true, title: 'Parcialmente completado', message: `${exitosos} agregado${exitosos !== 1 ? 's' : ''} correctamente. ${rechazados.length} con error: ${primerError}`, type: 'error' })
      }
      await fetchData()
    } catch (err: any) {
      setNotification({ open: true, title: 'Error', message: err.message || 'No se pudo agregar los jugadores', type: 'error' })
    } finally {
      setAgregando(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Volver al torneo
      </button>

      {/* Team header */}
      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="size-12 sm:size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">shield</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white break-words">{equipo.equipo_nombre}</h1>
            <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">{equipo.categoria_nombre}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 break-words">{torneo.nombre}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {esMiEquipo && (
                <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary whitespace-nowrap">Mi equipo</span>
              )}
              {esDelegado && (
                <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 whitespace-nowrap">Delegado</span>
              )}
              <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">
                {equipo.jugadores.length} jugador{equipo.jugadores.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-sm mt-2 ${abierto ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
              <span className="material-symbols-outlined text-lg">{abierto ? 'check_circle' : 'block'}</span>
              <span>
                {abierto
                  ? `Inscripciones abiertas${torneo.inscripcion_fin ? ` hasta ${formatDateOnly(torneo.inscripcion_fin)}` : ''}`
                  : 'Inscripciones cerradas'}
              </span>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mt-4">
          {esMiEquipo && equipo.jugadores.length > 0 && (
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-bold transition-colors disabled:opacity-50"
            >
              {generandoPDF ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando...</>
              ) : (
                <><span className="material-symbols-outlined text-xl">download</span>Descargar planilla</>
              )}
            </button>
          )}

          {esDelegado && abierto && (
            <button
              onClick={() => setShowModalAgregar(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary hover:bg-primary/10 rounded-xl text-base font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-xl">group_add</span>
              Agregar jugadores
            </button>
          )}

          {puedeSalir && (
            <button
              onClick={() => setShowConfirmSalir(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-500/10 rounded-xl text-base font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Salir del equipo
            </button>
          )}

          {!esDelegado && abierto && !esMiEquipo && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-lg">info</span>
              Pedile a tu delegado que te agregue a un equipo.
            </div>
          )}
        </div>
      </div>

      {/* Delegados del equipo */}
      {equipo.delegados && equipo.delegados.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl ring-1 ring-amber-200/70 dark:ring-amber-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Delegado{equipo.delegados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipo.delegados.map((d, idx) => (
              <span key={d.jugador_id ?? `${d.nombre}-${d.apellido}-${idx}`} className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-sm font-medium">
                {d.apellido}, {d.nombre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Player list */}
      <div>
        <h2 className="text-base font-bold text-[#617989] dark:text-slate-400 uppercase tracking-wider mb-3">
          Jugadores ({equipo.jugadores.length})
        </h2>

        {equipo.jugadores.length === 0 ? (
          <div className={`text-center py-10 ${cardClass}`}>
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-2">group</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay jugadores en este equipo</p>
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">search</span>
              <input
                type="text"
                value={busquedaRoster}
                onChange={(e) => setBusquedaRoster(e.target.value)}
                placeholder={esDelegado ? 'Buscar por nombre o DNI' : 'Buscar por nombre'}
                className="w-full pl-11 pr-11 h-11 bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-xl text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
              />
              {busquedaRoster && (
                <button
                  onClick={() => setBusquedaRoster('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              )}
            </div>

            {jugadoresFiltrados.length === 0 ? (
              <div className={`text-center py-8 px-4 ${cardClass}`}>
                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-1">search_off</span>
                <p className="text-base text-slate-500 dark:text-slate-400 break-words">Sin resultados para &quot;{busquedaRoster}&quot;</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {jugadoresFiltrados.map((jugador) => {
                  const esYo = jugador.id === jugadorId
                  const esDelegadoDeEste = equipo.delegados?.some(d => d.jugador_id === jugador.id)
                  const inicial = (jugador.apellido || jugador.nombre || '?').charAt(0).toUpperCase()
                  return (
                    <div key={jugador.id} className={`flex items-center gap-3 p-3 ${cardClass}`}>
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-base font-bold">
                        {inicial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <p className="text-base font-semibold text-slate-900 dark:text-white truncate min-w-0">
                            {jugador.apellido}, {jugador.nombre}
                          </p>
                          {esDelegadoDeEste && (
                            <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 shrink-0">DEL</span>
                          )}
                          {esYo && (
                            <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary shrink-0">Yo</span>
                          )}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap text-sm text-slate-500 dark:text-slate-400">
                          {jugador.dni && (
                            <span className="font-mono">DNI {formatDni(jugador.dni)}</span>
                          )}
                          {jugador.fecha_nacimiento && (
                            <span>Nac. {formatDateOnly(jugador.fecha_nacimiento)}</span>
                          )}
                          {jugador.posicion && (
                            <span>{jugador.posicion}</span>
                          )}
                        </div>
                      </div>
                      {esDelegado && abierto && (
                        <button
                          onClick={() => {
                            if (!torneo?.delegados_pueden_eliminar) {
                              setShowEliminacionBloqueada(true)
                            } else {
                              setShowConfirmQuitar({ id: jugador.id, nombre: `${jugador.apellido}, ${jugador.nombre}` })
                            }
                          }}
                          disabled={quitandoId === jugador.id}
                          aria-label={`Quitar a ${jugador.apellido}, ${jugador.nombre}`}
                          className="p-2.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        >
                          {quitandoId === jugador.id ? (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-xl">close</span>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══ Modals (portaled to body) ═══ */}
      {mounted && createPortal(
        <>
          {/* Modal agregar jugadores (checklist - delegado) */}
          {showModalAgregar && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => !agregando && cerrarModalAgregar()}
            >
              <div
                className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85dvh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-3 shrink-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Agregar jugadores</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Buscá por DNI y seleccioná los jugadores para{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{equipo.equipo_nombre}</span>
                  </p>
                </div>

                {/* Search bar */}
                <div className="px-5 pb-3 shrink-0">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                      type="text"
                      value={dniInput}
                      onChange={(e) => setDniInput(e.target.value)}
                      placeholder="Buscar por nombre, apellido o DNI..."
                      autoFocus
                      className="w-full pl-11 pr-11 h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                    {buscando ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : dniInput ? (
                      <button
                        onClick={() => { setDniInput(''); setResultadosBusqueda([]) }}
                        aria-label="Limpiar búsqueda"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    ) : null}
                  </div>
                  {dniInput.length > 0 && dniInput.length < 3 && (
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">Ingresá al menos 3 caracteres para buscar</p>
                  )}
                </div>

                {/* Scrollable results */}
                <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2">
                  {resultadosBusqueda.length > 0 && (
                    <div>
                      {dniInput && (
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Resultados ({resultadosBusqueda.length})
                        </p>
                      )}
                      <div className="flex flex-col gap-1">
                        {resultadosBusqueda.map(j => {
                          const seleccionado = jugadoresSeleccionados.some(s => s.id === j.id)
                          const yaEnEquipo = (equipo?.jugadores ?? []).some(jj => jj.id === j.id)
                          if (yaEnEquipo) {
                            return (
                              <div
                                key={j.id}
                                className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 cursor-default"
                              >
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 border-emerald-500 bg-emerald-500">
                                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                                    {j.apellido}, {j.nombre}
                                  </p>
                                  <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">{j.dni}</p>
                                </div>
                                <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                                  Ya en el equipo
                                </span>
                              </div>
                            )
                          }
                          if (j.equipo_en_torneo) {
                            return (
                              <div
                                key={j.id}
                                className="flex items-center gap-3 p-3 rounded-xl border bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 cursor-not-allowed"
                              >
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 border-red-300 bg-red-100">
                                  <span className="material-symbols-outlined text-red-500 text-sm">block</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-slate-500 dark:text-slate-400 truncate">
                                    {j.apellido}, {j.nombre}
                                  </p>
                                  <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">shield</span>
                                    Jugando en {j.equipo_en_torneo}
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          if (j.pagado === false) {
                            return (
                              <div
                                key={j.id}
                                className="flex items-center gap-3 p-3 rounded-xl border bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 cursor-not-allowed"
                              >
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 border-amber-300 bg-amber-100">
                                  <span className="material-symbols-outlined text-amber-600 text-sm">block</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-slate-500 dark:text-slate-400 truncate">
                                    {j.apellido}, {j.nombre}
                                  </p>
                                  <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-base">health_and_safety</span>
                                    Seguro no pagado
                                  </p>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <button
                              key={j.id}
                              onClick={() => {
                                setJugadoresSeleccionados(prev =>
                                  seleccionado ? prev.filter(s => s.id !== j.id) : [...prev, j]
                                )
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                                seleccionado
                                  ? 'bg-primary/5 border-primary/30 dark:bg-primary/10'
                                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border-2 ${
                                seleccionado
                                  ? 'bg-primary border-primary'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {seleccionado && (
                                  <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
                                  {j.apellido}, {j.nombre}
                                </p>
                                <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{j.dni}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {dniInput.length >= 3 && !buscando && resultadosBusqueda.length === 0 && (
                    <div className="text-center py-6">
                      <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600 block mb-1">search_off</span>
                      <p className="text-base text-slate-500 dark:text-slate-400">No se encontraron jugadores</p>
                    </div>
                  )}

                  {!dniInput && (
                    <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                      <span className="material-symbols-outlined text-3xl block mb-1">manage_search</span>
                      <p className="text-base">Buscá por nombre, apellido o DNI</p>
                    </div>
                  )}
                </div>

                {/* Selected bar (outside the scroll area) */}
                {jugadoresSeleccionados.length > 0 && (
                  <div className="shrink-0 flex items-center gap-2 px-5 py-2 border-t border-slate-100 dark:border-slate-700 overflow-x-auto">
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      {jugadoresSeleccionados.length} seleccionado{jugadoresSeleccionados.length !== 1 ? 's' : ''}
                    </span>
                    {jugadoresSeleccionados.map(j => (
                      <span
                        key={j.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
                      >
                        {j.apellido}, {j.nombre}
                        <button
                          onClick={() => setJugadoresSeleccionados(prev => prev.filter(s => s.id !== j.id))}
                          aria-label={`Quitar a ${j.apellido}, ${j.nombre} de la selección`}
                          className="ml-0.5 p-1 hover:text-primary/60 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-700 shrink-0 flex gap-3">
                  <button
                    onClick={cerrarModalAgregar}
                    disabled={agregando}
                    className={`flex-1 ${secondaryBtn}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarAgregar}
                    disabled={agregando || jugadoresSeleccionados.length === 0}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {agregando ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Agregando...</>
                    ) : jugadoresSeleccionados.length > 0 ? (
                      `Agregar ${jugadoresSeleccionados.length}`
                    ) : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal confirmar quitar jugador */}
          {showConfirmQuitar && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => !quitandoId && setShowConfirmQuitar(null)}
            >
              <div
                className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-2xl">person_remove</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Quitar jugador</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                  ¿Quitar a <span className="font-semibold text-slate-700 dark:text-slate-300">{showConfirmQuitar.nombre}</span> del equipo?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmQuitar(null)}
                    disabled={!!quitandoId}
                    className={`flex-1 ${secondaryBtn}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleQuitarJugador}
                    disabled={!!quitandoId}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-base font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {quitandoId ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Quitando...</>
                    ) : 'Quitar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal salir del equipo */}
          {showConfirmSalir && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => !saliendo && setShowConfirmSalir(false)}
            >
              <div
                className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-2xl">logout</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2 break-words">
                  ¿Seguro que querés salir de {equipo.equipo_nombre}?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                  Vas a dejar de figurar en la lista de buena fe. Para volver, el delegado te tiene que agregar de nuevo.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSalir(false)}
                    disabled={saliendo}
                    className={`flex-1 ${secondaryBtn}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalirEquipo}
                    disabled={saliendo}
                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-base font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saliendo ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saliendo...</>
                    ) : 'Salir del equipo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal eliminación bloqueada */}
          {showEliminacionBloqueada && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowEliminacionBloqueada(false)}
            >
              <div
                className="bg-white dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">lock</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-2">
                  Eliminación deshabilitada
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                  El club deshabilitó la eliminación de jugadores por parte de los delegados. Contactate con el club para que lo elimine.
                </p>
                <button
                  onClick={() => setShowEliminacionBloqueada(false)}
                  className={`w-full ${secondaryBtn}`}
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </>,
        document.body
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
