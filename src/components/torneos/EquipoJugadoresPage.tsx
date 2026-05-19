'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  getEquiposInscritos, getJugadoresEquipoTorneo,
  agregarJugadorEquipoTorneo, quitarJugadorEquipoTorneo,
  desinscribirEquipo,
  getDelegadosEquipoAdmin, asignarDelegadoAdmin, quitarDelegadoAdmin,
  buscarJugadorPorDni, actualizarInhabilitacionEquipoTorneo,
} from '@/lib/api'
import type { DelegadoEquipo, JugadorBusqueda } from '@/lib/api'
import type { Inscripcion, JugadorEquipoTorneo } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import { useAuthStore } from '@/stores/authStore'

interface Props {
  basePath: string
}

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '-'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

export default function EquipoJugadoresPage({ basePath }: Props) {
  const router = useRouter()
  const params = useParams()
  const torneoId = params.id as string
  const equipoId = params.equipoId as string
  const { user } = useAuthStore()

  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null)
  const [jugadores, setJugadores] = useState<JugadorEquipoTorneo[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Agregar jugador modal
  const [showModalAgregar, setShowModalAgregar] = useState(false)
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<JugadorBusqueda[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState<JugadorBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Quitar jugador confirm
  const [showConfirmQuitar, setShowConfirmQuitar] = useState<JugadorEquipoTorneo | null>(null)

  // Limpiar sin seguro
  const [showModalLimpiar, setShowModalLimpiar] = useState(false)
  const [limpiando, setLimpiando] = useState(false)

  const jugadoresSinPago = jugadores.filter(j => j.pagado === false)

  // Desinscribir equipo
  const [showConfirmDesinscribir, setShowConfirmDesinscribir] = useState(false)
  const [desinscribiendo, setDesinscribiendo] = useState(false)

  // Inhabilitación por deuda
  const [showModalInhabilitar, setShowModalInhabilitar] = useState(false)
  const [motivoInhabilitacion, setMotivoInhabilitacion] = useState('')
  const [passwordInhabilitacion, setPasswordInhabilitacion] = useState('')
  const [inhabilitacionError, setInhabilitacionError] = useState('')

  // Delegados
  const [delegados, setDelegados] = useState<DelegadoEquipo[]>([])
  const [showModalDelegados, setShowModalDelegados] = useState(false)
  const [busquedaDelegado, setBusquedaDelegado] = useState('')
  const [resultadosDelegado, setResultadosDelegado] = useState<JugadorBusqueda[]>([])
  const [buscandoDelegado, setBuscandoDelegado] = useState(false)
  const [asignandoDelegado, setAsignandoDelegado] = useState(false)
  const [quitandoDelegadoId, setQuitandoDelegadoId] = useState<string | null>(null)

  // PDF
  const [generandoPDF, setGenerandoPDF] = useState(false)

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, title: '', message: '', type: 'info'
  })

  useEffect(() => { loadData() }, [torneoId, equipoId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inscripcionesData, jugadoresData] = await Promise.all([
        getEquiposInscritos(torneoId),
        getJugadoresEquipoTorneo(torneoId, equipoId),
      ])
      const insc = inscripcionesData.find(i => i.id === equipoId || i.equipo_id === equipoId)
      setInscripcion(insc || null)
      setJugadores(jugadoresData)
      if (insc) {
        const delegadosData = await getDelegadosEquipoAdmin(insc.id)
        setDelegados(delegadosData)
      }
    } catch (error) {
      setNotification({ open: true, title: 'Error al cargar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Búsqueda dinámica de jugadores
  useEffect(() => {
    if (!showModalAgregar) return
    if (busqueda.length < 3) { setResultadosBusqueda([]); return }
    const timeout = setTimeout(async () => {
      try {
        setBuscando(true)
        const yaSeleccionados = new Set(jugadoresSeleccionados.map(j => j.id))
        const res = await buscarJugadorPorDni(busqueda, torneoId)
        // Mostrar todos — los ya en equipo se marcan en verde en el render
        setResultadosBusqueda((res ?? []).filter(j => !yaSeleccionados.has(j.id)))
      } catch { setResultadosBusqueda([]) }
      finally { setBuscando(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [busqueda, showModalAgregar, jugadores, jugadoresSeleccionados])

  const handleOpenAgregar = () => {
    setJugadoresSeleccionados([])
    setBusqueda('')
    setResultadosBusqueda([])
    setErrors({})
    setShowModalAgregar(true)
  }

  const handleOpenInhabilitar = () => {
    if (!inscripcion) return
    setMotivoInhabilitacion(inscripcion.inhabilitado_motivo || '')
    setPasswordInhabilitacion('')
    setInhabilitacionError('')
    setShowModalInhabilitar(true)
  }

  const handleActualizarInhabilitacion = async () => {
    if (!inscripcion) return
    if (!passwordInhabilitacion.trim()) {
      setInhabilitacionError('Ingresá tu contraseña')
      return
    }
    const nextValue = !inscripcion.inhabilitado_por_deuda
    try {
      setSubmitting(true)
      const updated = await actualizarInhabilitacionEquipoTorneo(inscripcion.id, {
        inhabilitado_por_deuda: nextValue,
        motivo: nextValue ? motivoInhabilitacion : undefined,
        password: passwordInhabilitacion,
      })
      setInscripcion(updated)
      setShowModalInhabilitar(false)
      setMotivoInhabilitacion('')
      setPasswordInhabilitacion('')
      setInhabilitacionError('')
      setNotification({
        open: true,
        title: nextValue ? 'Equipo inhabilitado' : 'Equipo habilitado',
        message: nextValue ? 'Los jugadores verán el aviso de falta de pago' : 'El equipo vuelve a estar disponible',
        type: 'success',
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al actualizar el equipo'
      if (msg.toLowerCase().includes('contraseña') || msg.toLowerCase().includes('password')) {
        setInhabilitacionError('Contraseña incorrecta')
      } else {
        setNotification({ open: true, title: 'Error', message: msg, type: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAgregarJugadores = async () => {
    if (jugadoresSeleccionados.length === 0) { setErrors({ jugador_id: 'Seleccioná al menos un jugador' }); return }
    try {
      setSubmitting(true)
      const nuevos: JugadorEquipoTorneo[] = []
      for (const j of jugadoresSeleccionados) {
        const nuevo = await agregarJugadorEquipoTorneo(torneoId, equipoId, { jugador_id: j.id })
        nuevos.push(nuevo)
      }
      setJugadores(prev => [...prev, ...nuevos])
      setShowModalAgregar(false)
      setNotification({ open: true, title: 'Jugadores agregados', message: `Se agregaron ${nuevos.length} jugador${nuevos.length > 1 ? 'es' : ''}`, type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al agregar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuitarJugador = async () => {
    if (!showConfirmQuitar) return
    try {
      await quitarJugadorEquipoTorneo(torneoId, equipoId, showConfirmQuitar.jugador_id)
      setJugadores(prev => prev.filter(j => j.id !== showConfirmQuitar.id))
      const nombre = showConfirmQuitar.nombre_completo
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Jugador quitado', message: `${nombre} fue quitado`, type: 'success' })
    } catch (error) {
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Error al quitar jugador', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    }
  }

  // Búsqueda dinámica para delegados
  useEffect(() => {
    if (!showModalDelegados) return
    if (busquedaDelegado.length < 3) { setResultadosDelegado([]); return }
    const yaIds = new Set(delegados.map(d => d.jugador_id))
    const timeout = setTimeout(async () => {
      try {
        setBuscandoDelegado(true)
        const res = await buscarJugadorPorDni(busquedaDelegado)
        setResultadosDelegado(res.filter(j => !yaIds.has(j.id)))
      } catch { setResultadosDelegado([]) }
      finally { setBuscandoDelegado(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [busquedaDelegado, showModalDelegados, delegados])

  const handleOpenModalDelegados = () => {
    setBusquedaDelegado('')
    setResultadosDelegado([])
    setShowModalDelegados(true)
  }

  const handleAsignarDelegado = async (jugadorId: string) => {
    if (!inscripcion) return
    try {
      setAsignandoDelegado(true)
      const nuevo = await asignarDelegadoAdmin(inscripcion.id, jugadorId)
      setDelegados(prev => [...prev, nuevo])
      setBusquedaDelegado('')
      setNotification({ open: true, title: 'Delegado asignado', message: 'El jugador fue asignado como delegado', type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error', message: error instanceof Error ? error.message : 'Error al asignar delegado', type: 'error' })
    } finally {
      setAsignandoDelegado(false)
    }
  }

  const handleQuitarDelegado = async (jugadorId: string) => {
    if (!inscripcion) return
    try {
      setQuitandoDelegadoId(jugadorId)
      await quitarDelegadoAdmin(inscripcion.id, jugadorId)
      setDelegados(prev => prev.filter(d => d.jugador_id !== jugadorId))
    } catch (error) {
      setNotification({ open: true, title: 'Error', message: error instanceof Error ? error.message : 'Error al quitar delegado', type: 'error' })
    } finally {
      setQuitandoDelegadoId(null)
    }
  }

  const handleLimpiarSinSeguro = async () => {
    try {
      setLimpiando(true)
      for (const j of jugadoresSinPago) {
        await quitarJugadorEquipoTorneo(torneoId, equipoId, j.jugador_id)
      }
      setJugadores(prev => prev.filter(j => j.pagado !== false))
      setShowModalLimpiar(false)
      setNotification({ open: true, title: 'Jugadores quitados', message: `Se quitaron ${jugadoresSinPago.length} jugador${jugadoresSinPago.length !== 1 ? 'es' : ''} sin seguro pagado`, type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error', message: error instanceof Error ? error.message : 'Error al quitar jugadores', type: 'error' })
    } finally {
      setLimpiando(false)
    }
  }

  const handleDesinscribirEquipo = async () => {
    if (!inscripcion) return
    try {
      setDesinscribiendo(true)
      await desinscribirEquipo(inscripcion.id)
      setShowConfirmDesinscribir(false)
      router.push(`${basePath}/${torneoId}`)
    } catch (error) {
      setShowConfirmDesinscribir(false)
      setNotification({ open: true, title: 'Error al desinscribir', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setDesinscribiendo(false)
    }
  }

  const handleDescargarPDF = async () => {
    if (!inscripcion || jugadores.length === 0) return
    try {
      setGenerandoPDF(true)
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

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

      const rows = jugadores.map((j) => `
        <tr>
          <td style="${tdBase}"></td>
          <td style="${tdBase}"></td>
          <td style="${tdBase}font-weight:700;text-transform:uppercase;">${`${(j.apellido || '').toUpperCase()} ${(j.nombre || '').toUpperCase()}`.trim()}</td>
          <td style="${tdBase}">${j.dni || '-'}</td>
          <td style="${tdBase}">${j.fecha_nacimiento ? (() => { const [y,m,d] = j.fecha_nacimiento!.split('-'); return `${d}/${m}/${y}` })() : '-'}</td>
          <td style="${tdBase}font-weight:700;">${inscripcion.categoria_nombre}</td>
          <td style="${tdBase}font-weight:700;text-transform:uppercase;">${inscripcion.equipo_nombre.toUpperCase()}</td>
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
                <th style="${thStyle}width:78px;">CATEGOR\u00cdA</th>
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
        const scaleRatio = contentWidthMM / canvas.width
        const imgHeightMM = canvas.height * scaleRatio
        const pageHeightPx = maxContentHeightMM / scaleRatio
        const pagesNeeded = Math.ceil(imgHeightMM / maxContentHeightMM)
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
        for (let page = 0; page < pagesNeeded; page++) {
          if (page > 0) pdf.addPage()
          const startY = Math.floor(page * pageHeightPx)
          const sliceHeight = Math.min(Math.ceil(pageHeightPx), canvas.height - startY)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sliceHeight
          const ctx = sliceCanvas.getContext('2d')!
          ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
          pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', marginMM, marginMM, contentWidthMM, sliceHeight * scaleRatio)
        }
        pdf.save(`${inscripcion.equipo_nombre.toLowerCase().replace(/\s+/g, '-')}-planilla.pdf`)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => router.push(`${basePath}/${torneoId}`)}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mb-3"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Volver al torneo
        </button>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
            {inscripcion?.equipo_logo_url ? (
              <img src={inscripcion.equipo_logo_url} alt={inscripcion.equipo_nombre} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-3xl text-primary">shield</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {inscripcion?.equipo_nombre || 'Equipo'}
              </h1>
              {inscripcion?.inhabilitado_por_deuda && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 text-[10px] font-semibold">
                  <span className="material-symbols-outlined text-xs">lock</span>
                  Deuda pendiente
                </span>
              )}
            </div>
            {inscripcion && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{inscripcion.categoria_nombre}</p>
            )}
            {inscripcion?.inhabilitado_motivo && (
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">{inscripcion.inhabilitado_motivo}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {jugadores.length > 0 && (
              <button
                onClick={handleDescargarPDF}
                disabled={generandoPDF}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Descargar planilla"
              >
                {generandoPDF ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">picture_as_pdf</span>
                )}
              </button>
            )}
            {inscripcion && (
              <button
                onClick={() => setShowConfirmDesinscribir(true)}
                className="p-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                title="Desinscribir equipo"
              >
                <span className="material-symbols-outlined text-xl text-slate-400 hover:text-red-500">delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Estado de pago ── */}
      {inscripcion && (
        <div className={`rounded-xl border p-4 ${
          inscripcion.inhabilitado_por_deuda
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                inscripcion.inhabilitado_por_deuda
                  ? 'bg-red-100 dark:bg-red-500/20'
                  : 'bg-green-100 dark:bg-green-500/20'
              }`}>
                <span className={`material-symbols-outlined text-xl ${
                  inscripcion.inhabilitado_por_deuda
                    ? 'text-red-600 dark:text-red-300'
                    : 'text-green-700 dark:text-green-400'
                }`}>
                  {inscripcion.inhabilitado_por_deuda ? 'lock' : 'lock_open'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Estado de pago del equipo</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inscripcion.inhabilitado_por_deuda
                    ? 'Inhabilitado por deuda pendiente'
                    : 'Habilitado para jugadores'}
                </p>
                {inscripcion.inhabilitado_motivo && (
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">{inscripcion.inhabilitado_motivo}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleOpenInhabilitar}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                inscripcion.inhabilitado_por_deuda
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {inscripcion.inhabilitado_por_deuda ? 'lock_open' : 'lock'}
              </span>
              {inscripcion.inhabilitado_por_deuda ? 'Habilitar equipo' : 'Inhabilitar por deuda'}
            </button>
          </div>
        </div>
      )}

      {/* ── Delegados ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">star</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Delegados</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{delegados.length} asignado{delegados.length !== 1 ? 's' : ''} · pueden gestionar el plantel</p>
            </div>
          </div>
          <button
            onClick={handleOpenModalDelegados}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Asignar
          </button>
        </div>

        <div className="p-4">
          {delegados.length === 0 ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">star_border</span>
              <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-sm">Sin delegados asignados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {delegados.map((d) => (
                <div key={d.jugador_id} className="flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-500/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-amber-700 dark:text-amber-400">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.apellido}, {d.nombre}</p>
                      {d.dni && <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {d.dni}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuitarDelegado(d.jugador_id)}
                    disabled={quitandoDelegadoId === d.jugador_id}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {quitandoDelegadoId === d.jugador_id ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-lg">close</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Jugadores ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">group</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Jugadores</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {jugadoresSinPago.length > 0 && user?.role === 'productor' && (
              <button
                onClick={() => setShowModalLimpiar(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                title="Quitar jugadores sin seguro pagado"
              >
                <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                Sin seguro ({jugadoresSinPago.length})
              </button>
            )}
            <button
              onClick={handleOpenAgregar}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Agregar
            </button>
          </div>
        </div>

        <div className="p-4">
          {jugadores.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">group</span>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">No hay jugadores en este equipo</p>
              <button
                onClick={handleOpenAgregar}
                className="mt-3 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Agregar jugadores
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {jugadores.map((jugador) => (
                <div key={jugador.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {jugador.foto_url ? (
                      <img src={jugador.foto_url} alt={jugador.nombre_completo} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg text-slate-400">person</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        {jugador.nombre_completo}
                        {jugador.capitan && <span className="text-amber-500 font-bold">(C)</span>}
                        {jugador.pagado === false && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] font-bold uppercase tracking-wide">
                            <span className="material-symbols-outlined text-xs">warning</span>
                            Sin seguro
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {jugador.dni && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-300">DNI:</span> {jugador.dni}
                          </p>
                        )}
                        {jugador.fecha_nacimiento && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Nac:</span> {formatFecha(jugador.fecha_nacimiento)}
                          </p>
                        )}
                        {jugador.posicion && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{jugador.posicion}</p>
                        )}
                        {jugador.numero_camiseta != null && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">#{jugador.numero_camiseta}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirmQuitar(jugador)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0 ml-2"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}

      {/* Modal asignar delegado */}
      {showModalDelegados && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !asignandoDelegado && setShowModalDelegados(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Asignar delegado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Los delegados pueden agregar jugadores al equipo</p>

            <div className="relative mb-3">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={busquedaDelegado}
                onChange={(e) => setBusquedaDelegado(e.target.value)}
                placeholder="Buscar por nombre, apellido o DNI..."
                autoFocus
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
              />
              {buscandoDelegado && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {busquedaDelegado.length > 0 && busquedaDelegado.length < 3 && (
              <p className="mb-2 text-xs text-slate-400">Ingresá al menos 3 caracteres para buscar</p>
            )}

            <div className="space-y-1 max-h-64 overflow-y-auto mb-3">
              {resultadosDelegado.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  {busquedaDelegado.length >= 3 && !buscandoDelegado ? 'Sin resultados' : 'Escribí un nombre, apellido o DNI para buscar'}
                </p>
              ) : resultadosDelegado.map((j) => (
                <div key={j.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div>
                    <p className="text-xs font-medium text-slate-900 dark:text-white">{j.apellido}, {j.nombre}</p>
                    {j.dni && <p className="text-[10px] text-slate-500">DNI: {j.dni}</p>}
                  </div>
                  <button
                    onClick={() => handleAsignarDelegado(j.id)}
                    disabled={asignandoDelegado}
                    className="px-3 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Asignar
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setShowModalDelegados(false)} className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal agregar jugadores */}
      {showModalAgregar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalAgregar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Agregar jugadores</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">a {inscripcion?.equipo_nombre}</p>
            </div>

            {/* Search */}
            <div className="px-5 pb-3 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, apellido o DNI..."
                  autoFocus
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                {buscando ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : busqueda ? (
                  <button onClick={() => { setBusqueda(''); setResultadosBusqueda([]) }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                ) : null}
              </div>
              {busqueda.length > 0 && busqueda.length < 3 && (
                <p className="mt-1.5 text-xs text-slate-400">Ingresá al menos 3 caracteres para buscar</p>
              )}
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pb-2 min-h-0 space-y-3">

              {/* Chips de seleccionados */}
              {jugadoresSeleccionados.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Seleccionados ({jugadoresSeleccionados.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {jugadoresSeleccionados.map(j => (
                      <span key={j.id} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                        {j.apellido}, {j.nombre}
                        <button onClick={() => setJugadoresSeleccionados(prev => prev.filter(s => s.id !== j.id))} className="ml-0.5 hover:text-primary/60">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados */}
              {resultadosBusqueda.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Resultados ({resultadosBusqueda.length})
                  </p>
                  <div className="flex flex-col gap-1">
                    {resultadosBusqueda.map(j => {
                      const yaEnEquipo = jugadores.some(jj => jj.jugador_id === j.id)
                      if (yaEnEquipo) {
                        return (
                          <div
                            key={j.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 cursor-default"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">check_circle</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{j.apellido}, {j.nombre}</p>
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">DNI: {j.dni}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 shrink-0 whitespace-nowrap">
                              Ya en el equipo
                            </span>
                          </div>
                        )
                      }
                      if (j.equipo_en_torneo && !jugadores.some(jj => jj.jugador_id === j.id)) {
                        return (
                          <div
                            key={j.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 cursor-not-allowed"
                          >
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-sm text-red-400">group</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{j.apellido}, {j.nombre}</p>
                              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">shield</span>
                                Jugando en {j.equipo_en_torneo}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-red-400 text-lg shrink-0">block</span>
                          </div>
                        )
                      }
                      if (j.pagado === false) {
                        return (
                          <div
                            key={j.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 text-left cursor-not-allowed"
                          >
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-sm text-red-400">person</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{j.apellido}, {j.nombre}</p>
                              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                Seguro no pagado
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-red-400 text-lg shrink-0">block</span>
                          </div>
                        )
                      }
                      return (
                        <button
                          key={j.id}
                          onClick={() => {
                            setJugadoresSeleccionados(prev => [...prev, j])
                            setResultadosBusqueda(prev => prev.filter(r => r.id !== j.id))
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{j.apellido}, {j.nombre}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">DNI: {j.dni}</p>
                          </div>
                          <span className="material-symbols-outlined text-primary text-lg shrink-0">add_circle</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Estado vacío */}
              {busqueda.length >= 3 && !buscando && resultadosBusqueda.length === 0 && jugadoresSeleccionados.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Sin resultados para &quot;{busqueda}&quot;</p>
              )}
              {busqueda.length === 0 && jugadoresSeleccionados.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Escribí un nombre, apellido o DNI para buscar</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              {errors.jugador_id && <p className="text-red-400 text-xs mb-2">{errors.jugador_id}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowModalAgregar(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleAgregarJugadores} disabled={submitting || jugadoresSeleccionados.length === 0} className="flex-[1.5] px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Agregando...</>) : `Agregar${jugadoresSeleccionados.length > 0 ? ` (${jugadoresSeleccionados.length})` : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal quitar jugador */}
      {showConfirmQuitar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmQuitar(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">person_remove</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quitar jugador</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              ¿Quitar a <strong>&quot;{showConfirmQuitar.nombre_completo}&quot;</strong> del equipo?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmQuitar(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={handleQuitarJugador} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">Quitar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal inhabilitar por deuda */}
      {showModalInhabilitar && inscripcion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalInhabilitar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${inscripcion.inhabilitado_por_deuda ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                <span className={`material-symbols-outlined text-lg ${inscripcion.inhabilitado_por_deuda ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {inscripcion.inhabilitado_por_deuda ? 'lock_open' : 'lock'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {inscripcion.inhabilitado_por_deuda ? 'Habilitar equipo' : 'Inhabilitar por deuda'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {inscripcion.inhabilitado_por_deuda
                ? <>Vas a habilitar <strong>&quot;{inscripcion.equipo_nombre}&quot;</strong> en {inscripcion.categoria_nombre}.</>
                : <>Vas a inhabilitar <strong>&quot;{inscripcion.equipo_nombre}&quot;</strong> en {inscripcion.categoria_nombre}. Los jugadores verán el aviso de falta de pago.</>}
            </p>
            {!inscripcion.inhabilitado_por_deuda && (
              <div className="mb-3">
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Motivo opcional</label>
                <textarea
                  value={motivoInhabilitacion}
                  onChange={(e) => setMotivoInhabilitacion(e.target.value)}
                  rows={3}
                  maxLength={240}
                  placeholder="Ej: Falta regularizar la cuota del torneo"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary resize-none"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={passwordInhabilitacion}
                onChange={(e) => { setPasswordInhabilitacion(e.target.value); setInhabilitacionError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${inhabilitacionError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleActualizarInhabilitacion() }}
              />
              {inhabilitacionError && <p className="text-red-400 text-xs mt-1">{inhabilitacionError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModalInhabilitar(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button
                onClick={handleActualizarInhabilitacion}
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${inscripcion.inhabilitado_por_deuda ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : inscripcion.inhabilitado_por_deuda ? 'Habilitar' : 'Inhabilitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal desinscribir equipo */}
      {showConfirmDesinscribir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !desinscribiendo && setShowConfirmDesinscribir(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Desinscribir equipo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              ¿Desinscribir a <strong>&quot;{inscripcion?.equipo_nombre}&quot;</strong> del torneo?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmDesinscribir(false)} disabled={desinscribiendo} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleDesinscribirEquipo} disabled={desinscribiendo} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {desinscribiendo ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Desinscribiendo...</>) : 'Desinscribir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal limpiar sin seguro */}
      {showModalLimpiar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !limpiando && setShowModalLimpiar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500 text-lg">shield_with_heart</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Quitar jugadores sin seguro</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Se quitarán del equipo los siguientes jugadores cuyo seguro no está pagado:
            </p>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto space-y-1.5">
              {jugadoresSinPago.map(j => (
                <div key={j.id} className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-red-400 text-base">person_remove</span>
                  <span className="font-medium text-slate-900 dark:text-white">{j.nombre_completo}</span>
                  {j.dni && <span className="text-slate-400 font-mono text-xs">DNI {j.dni}</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModalLimpiar(false)} disabled={limpiando} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleLimpiarSinSeguro} disabled={limpiando} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {limpiando ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Quitando...</>) : 'Confirmar'}
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
