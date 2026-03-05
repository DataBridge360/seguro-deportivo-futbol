'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  getEquiposInscritos, getJugadoresEquipoTorneo,
  agregarJugadorEquipoTorneo, quitarJugadorEquipoTorneo,
  getJugadores, getJugadoresProductor, desinscribirEquipo,
} from '@/lib/api'
import type { JugadorResponse } from '@/lib/api'
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
  const [jugadoresClub, setJugadoresClub] = useState<JugadorResponse[]>([])
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Quitar jugador confirm
  const [showConfirmQuitar, setShowConfirmQuitar] = useState<JugadorEquipoTorneo | null>(null)

  // Desinscribir equipo
  const [showConfirmDesinscribir, setShowConfirmDesinscribir] = useState(false)
  const [desinscribiendo, setDesinscribiendo] = useState(false)

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
      const insc = inscripcionesData.find(i => i.equipo_id === equipoId)
      setInscripcion(insc || null)
      setJugadores(jugadoresData)
    } catch (error) {
      setNotification({ open: true, title: 'Error al cargar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAgregar = async () => {
    setJugadoresSeleccionados([])
    setBusqueda('')
    setErrors({})
    setShowModalAgregar(true)
    if (jugadoresClub.length === 0) {
      try {
        const data = user?.role === 'productor' ? await getJugadoresProductor() : await getJugadores()
        setJugadoresClub(data)
      } catch { /* empty */ }
    }
  }

  const getJugadoresFiltrados = () => {
    const disponibles = jugadoresClub.filter(j => !jugadores.some(ya => ya.jugador_id === j.id))
    if (!busqueda.trim()) return disponibles
    const termino = busqueda.toLowerCase().trim()
    return disponibles.filter(j =>
      j.nombre.toLowerCase().includes(termino) ||
      j.apellido.toLowerCase().includes(termino) ||
      `${j.nombre} ${j.apellido}`.toLowerCase().includes(termino) ||
      (j.dni && j.dni.includes(termino))
    )
  }

  const handleAgregarJugadores = async () => {
    if (jugadoresSeleccionados.length === 0) { setErrors({ jugador_id: 'Seleccioná al menos un jugador' }); return }
    try {
      setSubmitting(true)
      const nuevos: JugadorEquipoTorneo[] = []
      for (const jugadorId of jugadoresSeleccionados) {
        const nuevo = await agregarJugadorEquipoTorneo(torneoId, equipoId, { jugador_id: jugadorId })
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
      await quitarJugadorEquipoTorneo(torneoId, equipoId, showConfirmQuitar.id)
      setJugadores(prev => prev.filter(j => j.id !== showConfirmQuitar.id))
      const nombre = showConfirmQuitar.nombre_completo
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Jugador quitado', message: `${nombre} fue quitado`, type: 'success' })
    } catch (error) {
      setShowConfirmQuitar(null)
      setNotification({ open: true, title: 'Error al quitar jugador', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
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
          <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-primary">shield</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {inscripcion?.equipo_nombre || 'Equipo'}
            </h1>
            {inscripcion && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{inscripcion.categoria_nombre}</p>
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
          <button
            onClick={handleOpenAgregar}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Agregar
          </button>
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
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {jugador.nombre_completo}
                        {jugador.capitan && <span className="ml-1.5 text-amber-500 font-bold">(C)</span>}
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

      {/* Modal agregar jugadores */}
      {showModalAgregar && (() => {
        const jugadoresFiltrados = getJugadoresFiltrados()
        const todosSeleccionados = jugadoresFiltrados.length > 0 && jugadoresFiltrados.every(j => jugadoresSeleccionados.includes(j.id))
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalAgregar(false)}>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Agregar jugadores</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">a {inscripcion?.equipo_nombre}</p>

              <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              {jugadoresFiltrados.length > 0 && (
                <label className="flex items-center gap-2.5 px-3 py-2 mb-2 rounded-lg bg-primary/5 dark:bg-primary/10 cursor-pointer border border-primary/20">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={() => {
                      if (todosSeleccionados) setJugadoresSeleccionados(prev => prev.filter(id => !jugadoresFiltrados.some(j => j.id === id)))
                      else setJugadoresSeleccionados(prev => [...new Set([...prev, ...jugadoresFiltrados.map(j => j.id)])])
                    }}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-xs font-medium text-primary">
                    {todosSeleccionados ? 'Deseleccionar todos' : `Seleccionar todos (${jugadoresFiltrados.length})`}
                  </span>
                </label>
              )}

              <div className="space-y-1 max-h-56 overflow-y-auto mb-3">
                {jugadoresFiltrados.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">{busqueda ? 'Sin resultados' : 'No hay jugadores disponibles'}</p>
                ) : jugadoresFiltrados.map((j) => (
                  <label key={j.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${jugadoresSeleccionados.includes(j.id) ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}>
                    <input type="checkbox" checked={jugadoresSeleccionados.includes(j.id)} onChange={() => setJugadoresSeleccionados(prev => prev.includes(j.id) ? prev.filter(id => id !== j.id) : [...prev, j.id])} className="w-4 h-4 rounded accent-primary" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{j.apellido}, {j.nombre}</p>
                      {j.dni && <p className="text-[10px] text-slate-500">DNI: {j.dni}</p>}
                    </div>
                  </label>
                ))}
              </div>

              {errors.jugador_id && <p className="text-red-400 text-xs mb-3">{errors.jugador_id}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowModalAgregar(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
                <button onClick={handleAgregarJugadores} disabled={submitting || jugadoresSeleccionados.length === 0} className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Agregando...</>) : `Agregar (${jugadoresSeleccionados.length})`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
