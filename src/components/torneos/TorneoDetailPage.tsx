'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  getTorneos, getEquiposInscritos, inscribirEquipo, desinscribirEquipo,
  getEquipos, getCategorias, toggleInscripciones, deleteTorneo, updateTorneo,
  getJugadoresEquipoTorneo,
} from '@/lib/api'
import type { Torneo, Inscripcion, Equipo, Categoria, InscribirEquipoDTO, JugadorEquipoTorneo, CreateTorneoDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'

interface Props {
  basePath: string
}

function formatDate(dateString: string) {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

function calcularEstado(torneo: Torneo): Torneo['estado'] {
  if (torneo.estado === 'cancelado') return 'cancelado'
  const hoy = new Date().toISOString().split('T')[0]
  if (hoy < torneo.fecha_inicio) return 'proximo'
  if (hoy >= torneo.fecha_inicio && hoy <= torneo.fecha_fin) return 'en_curso'
  return 'finalizado'
}

function getEstadoBadge(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'proximo': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    case 'finalizado': return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400'
    case 'cancelado': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
  }
}

function getEstadoLabel(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso': return 'En curso'
    case 'proximo': return 'Próximo'
    case 'finalizado': return 'Finalizado'
    case 'cancelado': return 'Cancelado'
  }
}

export default function TorneoDetailPage({ basePath }: Props) {
  const router = useRouter()
  const params = useParams()
  const torneoId = params.id as string

  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [equiposDisponibles, setEquiposDisponibles] = useState<Equipo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingInscripciones, setTogglingInscripciones] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modals
  const [showModalInscripcion, setShowModalInscripcion] = useState(false)
  const [showConfirmDesinscribir, setShowConfirmDesinscribir] = useState<{ id: string; nombre: string } | null>(null)
  const [showConfirmEliminarTorneo, setShowConfirmEliminarTorneo] = useState(false)
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false)

  // Delete
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Edit
  const [formEditar, setFormEditar] = useState<Partial<CreateTorneoDTO>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Inscription
  const [formInscripcion, setFormInscripcion] = useState<InscribirEquipoDTO>({ equipo_id: '', categoria_id: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Players cache (for PDF)
  const [jugadoresPorEquipo, setJugadoresPorEquipo] = useState<Record<string, JugadorEquipoTorneo[]>>({})

  // PDF state
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [cargandoJugadoresPDF, setCargandoJugadoresPDF] = useState(false)
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, phase: '' })

  // Category tabs
  const [categoriaTab, setCategoriaTab] = useState<string>('todos')

  // Info card
  const [infoOpen, setInfoOpen] = useState(false)

  // Menu
  const [menuOpen, setMenuOpen] = useState(false)

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false, title: '', message: '', type: 'info'
  })

  useEffect(() => { loadData() }, [torneoId])

  useEffect(() => {
    if (!menuOpen && !pdfMenuOpen) return
    const handler = () => { setMenuOpen(false); setPdfMenuOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [menuOpen, pdfMenuOpen])

  const categoriasDelTorneo = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; count: number }>()
    inscripciones.forEach(i => {
      const existing = map.get(i.categoria_id)
      if (existing) existing.count++
      else map.set(i.categoria_id, { id: i.categoria_id, nombre: i.categoria_nombre, count: 1 })
    })
    return Array.from(map.values())
  }, [inscripciones])

  const inscripcionesFiltradas = useMemo(() => {
    if (categoriaTab === 'todos') return inscripciones
    return inscripciones.filter(i => i.categoria_id === categoriaTab)
  }, [inscripciones, categoriaTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const [torneosData, inscripcionesData, equiposData, categoriasData] = await Promise.all([
        getTorneos(), getEquiposInscritos(torneoId), getEquipos(), getCategorias(),
      ])
      const torneoActual = torneosData.find(t => t.id === torneoId)
      if (!torneoActual) {
        setNotification({ open: true, title: 'Torneo no encontrado', message: 'El torneo solicitado no existe', type: 'error' })
        router.push(basePath)
        return
      }
      setTorneo(torneoActual)
      setInscripciones(inscripcionesData)
      setEquiposDisponibles(equiposData)
      setCategorias(categoriasData)
    } catch (error) {
      setNotification({ open: true, title: 'Error al cargar datos', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ─── Inscripciones toggle ──────────────────────────────

  const handleToggleInscripciones = async () => {
    if (!torneo) return
    try {
      setTogglingInscripciones(true)
      const updated = await toggleInscripciones(torneo.id, !torneo.inscripciones_abiertas)
      setTorneo(updated)
    } catch (error) {
      setNotification({ open: true, title: 'Error', message: error instanceof Error ? error.message : 'Error al cambiar inscripciones', type: 'error' })
    } finally {
      setTogglingInscripciones(false)
    }
  }

  // ─── Edit torneo ───────────────────────────────────────

  const handleOpenEditar = () => {
    if (!torneo) return
    setFormEditar({
      nombre: torneo.nombre,
      descripcion: torneo.descripcion || '',
      fecha_inicio: torneo.fecha_inicio,
      fecha_fin: torneo.fecha_fin,
      inscripcion_inicio: torneo.inscripcion_inicio || '',
      inscripcion_fin: torneo.inscripcion_fin || '',
      categoria_ids: torneo.categorias?.map(c => c.id) || [],
    })
    setEditErrors({})
    setShowModalEditar(true)
  }

  const handleGuardarEdicion = async () => {
    if (!torneo) return
    const newErrors: Record<string, string> = {}
    if (!formEditar.nombre?.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!formEditar.fecha_inicio) newErrors.fecha_inicio = 'Obligatoria'
    if (!formEditar.fecha_fin) newErrors.fecha_fin = 'Obligatoria'
    if (formEditar.fecha_inicio && formEditar.fecha_fin && formEditar.fecha_fin < formEditar.fecha_inicio) {
      newErrors.fecha_fin = 'Debe ser posterior al inicio'
    }
    if (Object.keys(newErrors).length > 0) { setEditErrors(newErrors); return }

    try {
      setSubmitting(true)
      const updated = await updateTorneo(torneo.id, formEditar)
      setTorneo(updated)
      setShowModalEditar(false)
      setNotification({ open: true, title: 'Torneo actualizado', message: 'Los cambios se guardaron correctamente', type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al actualizar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete torneo ─────────────────────────────────────

  const handleEliminarTorneo = async () => {
    if (!torneo) return
    if (!deletePassword.trim()) { setDeleteError('Ingresá tu contraseña'); return }
    try {
      setSubmitting(true)
      await deleteTorneo(torneo.id, deletePassword)
      setShowConfirmEliminarTorneo(false)
      setNotification({ open: true, title: 'Torneo eliminado', message: `"${torneo.nombre}" fue eliminado`, type: 'success' })
      setTimeout(() => router.push(basePath), 1500)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      if (msg.toLowerCase().includes('contraseña')) {
        setDeleteError('Contraseña incorrecta')
      } else {
        setShowConfirmEliminarTorneo(false)
        setNotification({ open: true, title: 'Error al eliminar', message: msg, type: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Inscribir equipo ──────────────────────────────────

  const handleInscribir = async () => {
    const newErrors: Record<string, string> = {}
    if (!formInscripcion.equipo_id) newErrors.equipo_id = 'Seleccioná un equipo'
    else if (inscripciones.some(i => i.equipo_id === formInscripcion.equipo_id)) newErrors.equipo_id = 'Este equipo ya está inscrito'
    if (!formInscripcion.categoria_id) newErrors.categoria_id = 'Seleccioná una categoría'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    try {
      setSubmitting(true)
      const nueva = await inscribirEquipo(torneoId, formInscripcion)
      setInscripciones(prev => [...prev, nueva])
      setShowModalInscripcion(false)
      setNotification({ open: true, title: 'Equipo inscrito', message: `Inscrito en categoría ${nueva.categoria_nombre}`, type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al inscribir', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesinscribir = async () => {
    if (!showConfirmDesinscribir) return
    try {
      await desinscribirEquipo(showConfirmDesinscribir.id)
      setInscripciones(prev => prev.filter(i => i.id !== showConfirmDesinscribir.id))
      const nombre = showConfirmDesinscribir.nombre
      setShowConfirmDesinscribir(null)
      setNotification({ open: true, title: 'Equipo desinscrito', message: `"${nombre}" fue desinscrito`, type: 'success' })
    } catch (error) {
      setShowConfirmDesinscribir(null)
      setNotification({ open: true, title: 'Error al desinscribir', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    }
  }

  // ─── PDF ───────────────────────────────────────────────

  const formatFechaNacimiento = (fecha: string | null | undefined): string => {
    if (!fecha) return '-'
    const [y, m, d] = fecha.split('-')
    return `${d}/${m}/${y}`
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

  const ensureJugadoresCargados = async (equipoIds: string[]): Promise<Record<string, JugadorEquipoTorneo[]>> => {
    let localJugadores = { ...jugadoresPorEquipo }
    const sinJugadores = equipoIds.filter(eid => !localJugadores[eid])
    if (sinJugadores.length === 0) return localJugadores

    setCargandoJugadoresPDF(true)
    setPdfProgress({ current: 0, total: sinJugadores.length, phase: 'Cargando jugadores' })
    const newData: Record<string, JugadorEquipoTorneo[]> = {}
    const BATCH_SIZE = 5
    let loaded = 0
    for (let i = 0; i < sinJugadores.length; i += BATCH_SIZE) {
      const batch = sinJugadores.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (equipoId) => {
          const jugadores = await getJugadoresEquipoTorneo(torneoId, equipoId)
          return { equipoId, jugadores }
        })
      )
      results.forEach(r => {
        if (r.status === 'fulfilled') newData[r.value.equipoId] = r.value.jugadores
      })
      loaded += batch.length
      setPdfProgress({ current: loaded, total: sinJugadores.length, phase: 'Cargando jugadores' })
    }
    setJugadoresPorEquipo(prev => ({ ...prev, ...newData }))
    setCargandoJugadoresPDF(false)
    localJugadores = { ...localJugadores, ...newData }
    return localJugadores
  }

  const generarPDF = async (pdfInscripciones: Inscripcion[], filename: string) => {
    try {
      setGenerandoPDF(true)
      setPdfProgress({ current: 0, total: pdfInscripciones.length, phase: 'Generando PDF' })

      const equipoIds = [...new Set(pdfInscripciones.map(i => i.equipo_id))]
      const localJugadores = await ensureJugadoresCargados(equipoIds)

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

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

      for (let idx = 0; idx < pdfInscripciones.length; idx++) {
        const inscripcion = pdfInscripciones[idx]
        const jugadoresEquipo = localJugadores[inscripcion.equipo_id] || []
        const rows = jugadoresEquipo.map((j) => `
          <tr>
            <td style="${tdBase}"></td>
            <td style="${tdBase}"></td>
            <td style="${tdBase}font-weight:700;text-transform:uppercase;">${`${(j.apellido || '').toUpperCase()} ${(j.nombre || '').toUpperCase()}`.trim()}</td>
            <td style="${tdBase}">${j.dni || '-'}</td>
            <td style="${tdBase}">${formatFechaNacimiento(j.fecha_nacimiento)}</td>
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
          for (let page = 0; page < pagesNeeded; page++) {
            if (idx > 0 || page > 0) pdf.addPage()
            const startY = Math.floor(page * pageHeightPx)
            const sliceHeight = Math.min(Math.ceil(pageHeightPx), canvas.height - startY)
            const sliceCanvas = document.createElement('canvas')
            sliceCanvas.width = canvas.width
            sliceCanvas.height = sliceHeight
            const ctx = sliceCanvas.getContext('2d')!
            ctx.drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight)
            const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95)
            pdf.addImage(sliceImgData, 'JPEG', marginMM, marginMM, contentWidthMM, sliceHeight * scaleRatio)
          }
        } finally {
          document.body.removeChild(container)
        }
        setPdfProgress({ current: idx + 1, total: pdfInscripciones.length, phase: 'Generando PDF' })
        await new Promise(r => setTimeout(r, 50))
      }

      pdf.save(filename)
      setNotification({ open: true, title: 'PDF generado', message: 'Descargado exitosamente', type: 'success' })
    } catch (error) {
      setNotification({ open: true, title: 'Error al generar PDF', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setGenerandoPDF(false)
      setCargandoJugadoresPDF(false)
      setPdfProgress({ current: 0, total: 0, phase: '' })
    }
  }

  const handleDescargarCategoria = () => {
    if (categoriaTab === 'todos') return
    const cat = categoriasDelTorneo.find(c => c.id === categoriaTab)
    const insc = inscripciones.filter(i => i.categoria_id === categoriaTab)
    generarPDF(insc, `${cat?.nombre || 'categoria'}-planilla.pdf`)
  }

  const handleDescargarTodo = () => {
    generarPDF(inscripciones, `${torneo?.nombre || 'torneo'}-planilla-completa.pdf`)
  }

  // ─── Render ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!torneo) return null

  const estadoCalculado = calcularEstado(torneo)
  const inscripcionesAbiertas = torneo.inscripciones_abiertas
  const hoyStr = new Date().toISOString().split('T')[0]
  const inscripcionVencida = torneo.inscripcion_fin && hoyStr > torneo.inscripcion_fin

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push(basePath)} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            Volver
          </button>
          <div className="flex items-center gap-2">
            {inscripciones.length > 0 && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setPdfMenuOpen(!pdfMenuOpen) }}
                  disabled={generandoPDF || cargandoJugadoresPDF}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Descargar PDF"
                >
                  {(generandoPDF || cargandoJugadoresPDF) ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">picture_as_pdf</span>
                  )}
                </button>
                {pdfMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[200px]">
                    <button
                      onClick={() => { setPdfMenuOpen(false); handleDescargarTodo() }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">picture_as_pdf</span>
                      Todos los equipos
                    </button>
                    {categoriasDelTorneo.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setPdfMenuOpen(false); generarPDF(inscripciones.filter(i => i.categoria_id === cat.id), `${cat.nombre}-planilla.pdf`) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-primary">filter_list</span>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">more_vert</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                  <button
                    onClick={() => { setMenuOpen(false); handleOpenEditar() }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Editar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setShowConfirmEliminarTorneo(true); setDeletePassword(''); setDeleteError('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{torneo.nombre}</h1>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(estadoCalculado)}`}>
            {getEstadoLabel(estadoCalculado)}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
        </p>
      </div>

      {/* ── Toggle inscripciones ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${inscripcionesAbiertas ? 'bg-green-100 dark:bg-green-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <span className={`material-symbols-outlined text-xl ${inscripcionesAbiertas ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {inscripcionesAbiertas ? 'lock_open' : 'lock'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Inscripciones</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {inscripcionesAbiertas ? 'Los equipos pueden inscribirse' : 'Las inscripciones están cerradas'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleInscripciones}
            disabled={togglingInscripciones}
            className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
              inscripcionesAbiertas ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
              inscripcionesAbiertas ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* ── Info card (collapsible) ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setInfoOpen(v => !v)}
          className="w-full px-4 py-3 flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">emoji_events</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white flex-1">Información</p>
          <span className={`material-symbols-outlined text-xl text-slate-400 transition-transform duration-200 ${infoOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>
        {infoOpen && (
          <div className="p-4 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-700">
            {torneo.descripcion && (
              <p className="text-sm text-slate-600 dark:text-slate-400 pt-4">{torneo.descripcion}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Inscripción</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {torneo.inscripcion_inicio ? formatDate(torneo.inscripcion_inicio) : '—'} - {torneo.inscripcion_fin ? formatDate(torneo.inscripcion_fin) : '—'}
                  </p>
                  {inscripcionVencida && (
                    <p className="text-xs text-red-500 font-medium mt-1">Vencida</p>
                  )}
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Máx. jugadores</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{torneo.max_jugadores_por_equipo} por equipo</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Equipos</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{inscripciones.length} inscrito{inscripciones.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {torneo.categorias && torneo.categorias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {torneo.categorias.map((cat) => (
                  <span key={cat.id} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                    {cat.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Equipos inscritos ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">groups</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Equipos inscritos</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{inscripcionesFiltradas.length} equipo{inscripcionesFiltradas.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => { setFormInscripcion({ equipo_id: '', categoria_id: '' }); setErrors({}); setShowModalInscripcion(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-lg">group_add</span>
            Inscribir
          </button>
        </div>

        {categoriasDelTorneo.length > 1 && (
          <div className="px-4 pt-3 pb-0 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              <button
                onClick={() => setCategoriaTab('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  categoriaTab === 'todos'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Todos ({inscripciones.length})
              </button>
              {categoriasDelTorneo.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaTab(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    categoriaTab === cat.id
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {cat.nombre} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          {inscripcionesFiltradas.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">groups</span>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">No hay equipos inscritos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inscripcionesFiltradas.map((inscripcion) => (
                <Link
                  key={inscripcion.id}
                  href={`${basePath}/${torneoId}/equipo/${inscripcion.equipo_id}`}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-xl text-primary">shield</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{inscripcion.equipo_nombre}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{inscripcion.categoria_nombre}</p>
                  </div>
                  <span className="material-symbols-outlined text-xl text-slate-400 shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ MODALS ═══════ */}

      {/* Modal inscribir equipo */}
      {showModalInscripcion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalInscripcion(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Inscribir equipo</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Categoría <span className="text-red-500">*</span></label>
                <select
                  value={formInscripcion.categoria_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, categoria_id: e.target.value, equipo_id: '' }))}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${errors.categoria_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  <option value="">Seleccionar categoría</option>
                  {(torneo.categorias && torneo.categorias.length > 0
                    ? categorias.filter(cat => torneo.categorias!.some(tc => tc.id === cat.id))
                    : categorias
                  ).map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
                </select>
                {errors.categoria_id && <p className="text-red-400 text-xs mt-1">{errors.categoria_id}</p>}
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Equipo <span className="text-red-500">*</span></label>
                <select
                  value={formInscripcion.equipo_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, equipo_id: e.target.value }))}
                  disabled={!formInscripcion.categoria_id}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50 ${errors.equipo_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  <option value="">{formInscripcion.categoria_id ? 'Seleccionar equipo' : 'Primero seleccioná una categoría'}</option>
                  {formInscripcion.categoria_id && equiposDisponibles
                    .filter(e => e.activo && e.categorias?.some(c => c.id === formInscripcion.categoria_id))
                    .map(equipo => (<option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>))}
                </select>
                {errors.equipo_id && <p className="text-red-400 text-xs mt-1">{errors.equipo_id}</p>}
                {formInscripcion.categoria_id && equiposDisponibles.filter(e => e.activo && e.categorias?.some(c => c.id === formInscripcion.categoria_id)).length === 0 && (
                  <p className="text-amber-500 text-xs mt-1">No hay equipos en esta categoría</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModalInscripcion(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleInscribir} disabled={submitting} className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Inscribiendo...</>) : 'Inscribir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal desinscribir */}
      {showConfirmDesinscribir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmDesinscribir(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Desinscribir equipo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              ¿Desinscribir a <strong>&quot;{showConfirmDesinscribir.nombre}&quot;</strong> del torneo?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmDesinscribir(null)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
              <button onClick={handleDesinscribir} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">Desinscribir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar torneo */}
      {showConfirmEliminarTorneo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { if (!submitting) { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') } }}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Eliminar torneo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Estás por eliminar <strong>&quot;{torneo.nombre}&quot;</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="mb-4">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary ${deleteError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                onKeyDown={(e) => { if (e.key === 'Enter' && deletePassword) handleEliminarTorneo() }}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') }} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleEliminarTorneo} disabled={submitting} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Eliminando...</>) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar torneo */}
      {showModalEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalEditar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Editar torneo</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={formEditar.nombre || ''} onChange={(e) => setFormEditar(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${editErrors.nombre ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`} />
                {editErrors.nombre && <p className="text-red-400 text-xs mt-1">{editErrors.nombre}</p>}
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Descripción</label>
                <textarea value={formEditar.descripcion || ''} onChange={(e) => setFormEditar(prev => ({ ...prev, descripcion: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Inicio <span className="text-red-500">*</span></label>
                  <DatePicker value={formEditar.fecha_inicio || ''} onChange={(val) => setFormEditar(prev => ({ ...prev, fecha_inicio: val }))} placeholder="Inicio" hasError={!!editErrors.fecha_inicio} />
                  {editErrors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{editErrors.fecha_inicio}</p>}
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Fin <span className="text-red-500">*</span></label>
                  <DatePicker value={formEditar.fecha_fin || ''} onChange={(val) => setFormEditar(prev => ({ ...prev, fecha_fin: val }))} placeholder="Fin" hasError={!!editErrors.fecha_fin} />
                  {editErrors.fecha_fin && <p className="text-red-400 text-xs mt-1">{editErrors.fecha_fin}</p>}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Inscripción</label>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker value={formEditar.inscripcion_inicio || ''} onChange={(val) => setFormEditar(prev => ({ ...prev, inscripcion_inicio: val }))} placeholder="Apertura" />
                  <DatePicker value={formEditar.inscripcion_fin || ''} onChange={(val) => setFormEditar(prev => ({ ...prev, inscripcion_fin: val }))} placeholder="Cierre" />
                </div>
              </div>
              {categorias.length > 0 && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1">Categorías</label>
                  <div className="flex flex-wrap gap-1.5">
                    {categorias.map((cat) => {
                      const sel = formEditar.categoria_ids?.includes(cat.id)
                      return (
                        <button key={cat.id} type="button" onClick={() => setFormEditar(prev => {
                          const ids = prev.categoria_ids || []
                          return { ...prev, categoria_ids: ids.includes(cat.id) ? ids.filter(id => id !== cat.id) : [...ids, cat.id] }
                        })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sel ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >{cat.nombre}</button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModalEditar(false)} disabled={submitting} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">Cancelar</button>
              <button onClick={handleGuardarEdicion} disabled={submitting} className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>) : 'Guardar'}
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
