'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { getTorneos, getEquiposInscritos, inscribirEquipo, desinscribirEquipo, getEquipos, getCategorias, toggleInscripciones, deleteTorneo, updateTorneo, getJugadoresEquipoTorneo, agregarJugadorEquipoTorneo, quitarJugadorEquipoTorneo, getJugadores, getJugadoresProductor } from '@/lib/api'
import type { JugadorResponse } from '@/lib/api'
import type { Torneo, Inscripcion, Equipo, Categoria, InscribirEquipoDTO, JugadorEquipoTorneo, CreateTorneoDTO } from '@/types/club'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { useAuthStore } from '@/stores/authStore'

function formatDate(dateString: string) {
  const [y, m, d] = dateString.split('-')
  return `${d}/${m}/${y}`
}

// Calcular estado automático basado en fechas
function calcularEstado(torneo: Torneo): Torneo['estado'] {
  if (torneo.estado === 'cancelado') return 'cancelado'

  const hoy = new Date().toISOString().split('T')[0]

  if (hoy < torneo.fecha_inicio) {
    return 'proximo'
  } else if (hoy >= torneo.fecha_inicio && hoy <= torneo.fecha_fin) {
    return 'en_curso'
  } else {
    return 'finalizado'
  }
}

function getEstadoBadge(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso':
      return { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dot: 'bg-emerald-500' }
    case 'proximo':
      return { bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dot: 'bg-blue-500' }
    case 'finalizado':
      return { bg: 'bg-slate-500/10 text-slate-500 border-slate-500/20', dot: 'bg-slate-500' }
    case 'cancelado':
      return { bg: 'bg-red-500/10 text-red-500 border-red-500/20', dot: 'bg-red-500' }
  }
}

function getEstadoLabel(estado: Torneo['estado']) {
  switch (estado) {
    case 'en_curso':
      return 'En curso'
    case 'proximo':
      return 'Próximo'
    case 'finalizado':
      return 'Finalizado'
    case 'cancelado':
      return 'Cancelado'
  }
}

export default function DetalleTorneoPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const basePath = pathname.replace(/\/[^/]+$/, '')
  const torneoId = params.id as string
  const { user } = useAuthStore()

  const [torneo, setTorneo] = useState<Torneo | null>(null)
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [equiposDisponibles, setEquiposDisponibles] = useState<Equipo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingInscripciones, setTogglingInscripciones] = useState(false)
  const [showModalInscripcion, setShowModalInscripcion] = useState(false)
  const [showConfirmDesinscribir, setShowConfirmDesinscribir] = useState<{ id: string; nombre: string } | null>(null)
  const [showConfirmEliminarTorneo, setShowConfirmEliminarTorneo] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Estado para edición de torneo
  const [showModalEditar, setShowModalEditar] = useState(false)
  const [formEditar, setFormEditar] = useState<Partial<CreateTorneoDTO>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Estado para descarga de PDF
  const [showModalPDF, setShowModalPDF] = useState(false)
  const [equiposParaPDF, setEquiposParaPDF] = useState<string[]>([])
  const [generandoPDF, setGenerandoPDF] = useState(false)

  const [formInscripcion, setFormInscripcion] = useState<InscribirEquipoDTO>({
    equipo_id: '',
    categoria_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Jugadores en equipo-torneo
  const [expandedEquipo, setExpandedEquipo] = useState<string | null>(null)
  const [jugadoresPorEquipo, setJugadoresPorEquipo] = useState<Record<string, JugadorEquipoTorneo[]>>({})
  const [loadingJugadores, setLoadingJugadores] = useState<string | null>(null)
  const [showModalAgregarJugador, setShowModalAgregarJugador] = useState<{ equipoId: string; equipoNombre: string } | null>(null)
  const [showConfirmQuitarJugador, setShowConfirmQuitarJugador] = useState<{ equipoId: string; jugador: JugadorEquipoTorneo } | null>(null)
  const [jugadoresClub, setJugadoresClub] = useState<JugadorResponse[]>([])
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<string[]>([])
  const [busquedaJugador, setBusquedaJugador] = useState('')

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  useEffect(() => {
    loadData()
  }, [torneoId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar torneo, inscripciones, equipos y categorías en paralelo
      const [torneosData, inscripcionesData, equiposData, categoriasData] = await Promise.all([
        getTorneos(),
        getEquiposInscritos(torneoId),
        getEquipos(),
        getCategorias(),
      ])

      const torneoActual = torneosData.find(t => t.id === torneoId)
      if (!torneoActual) {
        setNotification({
          open: true,
          title: 'Torneo no encontrado',
          message: 'El torneo solicitado no existe',
          type: 'error'
        })
        router.push(basePath)
        return
      }

      setTorneo(torneoActual)
      setInscripciones(inscripcionesData)
      setEquiposDisponibles(equiposData)
      setCategorias(categoriasData)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al cargar datos',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Compute effective inscription status
  const getInscripcionesEfectivas = (): boolean => {
    if (!torneo) return false
    return torneo.inscripciones_abiertas
  }

  const handleToggleInscripciones = async () => {
    if (!torneo) return
    const nuevoEstado = !getInscripcionesEfectivas()

    try {
      setTogglingInscripciones(true)
      const updated = await toggleInscripciones(torneo.id, nuevoEstado)
      setTorneo(updated)
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error',
        message: error instanceof Error ? error.message : 'Error al cambiar inscripciones',
        type: 'error'
      })
    } finally {
      setTogglingInscripciones(false)
    }
  }

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

    // Validaciones
    const newErrors: Record<string, string> = {}
    if (!formEditar.nombre?.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }
    if (!formEditar.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria'
    }
    if (!formEditar.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria'
    }
    if (formEditar.fecha_inicio && formEditar.fecha_fin && formEditar.fecha_fin < formEditar.fecha_inicio) {
      newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la de inicio'
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors)
      return
    }

    try {
      setSubmitting(true)
      const updated = await updateTorneo(torneo.id, formEditar)
      setTorneo(updated)
      setShowModalEditar(false)
      setNotification({
        open: true,
        title: 'Torneo actualizado',
        message: 'Los cambios se guardaron correctamente',
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al actualizar',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCategoriaEditar = (catId: string) => {
    setFormEditar(prev => {
      const ids = prev.categoria_ids || []
      return {
        ...prev,
        categoria_ids: ids.includes(catId)
          ? ids.filter(id => id !== catId)
          : [...ids, catId],
      }
    })
  }

  const handleEliminarTorneo = async () => {
    if (!torneo) return
    if (!deletePassword.trim()) {
      setDeleteError('Ingresá tu contraseña')
      return
    }
    try {
      setSubmitting(true)
      await deleteTorneo(torneo.id, deletePassword)
      setShowConfirmEliminarTorneo(false)
      setDeletePassword('')
      setDeleteError('')
      setNotification({
        open: true,
        title: 'Torneo eliminado',
        message: `El torneo "${torneo.nombre}" fue eliminado`,
        type: 'success'
      })
      setTimeout(() => {
        router.push(basePath)
      }, 1500)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido'
      if (msg.toLowerCase().includes('contraseña')) {
        setDeleteError('Contraseña incorrecta')
      } else {
        setShowConfirmEliminarTorneo(false)
        setDeletePassword('')
        setDeleteError('')
        setNotification({
          open: true,
          title: 'Error al eliminar',
          message: msg,
          type: 'error'
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenModalInscripcion = () => {
    setFormInscripcion({ equipo_id: '', categoria_id: '' })
    setErrors({})
    setShowModalInscripcion(true)
  }

  const validateInscripcion = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formInscripcion.equipo_id) {
      newErrors.equipo_id = 'Debe seleccionar un equipo'
    } else {
      // Verificar si el equipo ya está inscrito
      const yaInscrito = inscripciones.some(i => i.equipo_id === formInscripcion.equipo_id)
      if (yaInscrito) {
        newErrors.equipo_id = 'Este equipo ya está inscrito en el torneo'
      }
    }

    if (!formInscripcion.categoria_id) {
      newErrors.categoria_id = 'Debe seleccionar una categoría'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInscribir = async () => {
    if (!validateInscripcion()) return

    try {
      setSubmitting(true)
      const nuevaInscripcion = await inscribirEquipo(torneoId, formInscripcion)
      setInscripciones(prev => [...prev, nuevaInscripcion])
      setShowModalInscripcion(false)
      setNotification({
        open: true,
        title: 'Equipo inscrito',
        message: `El equipo fue inscrito exitosamente en la categoría ${nuevaInscripcion.categoria_nombre}`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al inscribir',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesinscribir = async () => {
    if (!showConfirmDesinscribir) return

    try {
      await desinscribirEquipo(showConfirmDesinscribir.id)
      setInscripciones(prev => prev.filter(i => i.id !== showConfirmDesinscribir.id))
      setShowConfirmDesinscribir(null)
      setNotification({
        open: true,
        title: 'Equipo desinscrito',
        message: `El equipo "${showConfirmDesinscribir.nombre}" fue desinscrito del torneo`,
        type: 'success'
      })
    } catch (error) {
      setShowConfirmDesinscribir(null)
      setNotification({
        open: true,
        title: 'Error al desinscribir',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    }
  }

  const handleToggleEquipo = async (equipoId: string) => {
    if (expandedEquipo === equipoId) {
      setExpandedEquipo(null)
      return
    }

    setExpandedEquipo(equipoId)

    // Lazy load jugadores if not already loaded
    if (!jugadoresPorEquipo[equipoId]) {
      try {
        setLoadingJugadores(equipoId)
        const jugadores = await getJugadoresEquipoTorneo(torneoId, equipoId)
        setJugadoresPorEquipo(prev => ({ ...prev, [equipoId]: jugadores }))
      } catch (error) {
        setNotification({
          open: true,
          title: 'Error al cargar jugadores',
          message: error instanceof Error ? error.message : 'Error desconocido',
          type: 'error'
        })
      } finally {
        setLoadingJugadores(null)
      }
    }
  }

  const handleOpenAgregarJugador = async (equipoId: string, equipoNombre: string) => {
    setJugadoresSeleccionados([])
    setBusquedaJugador('')
    setErrors({})
    setShowModalAgregarJugador({ equipoId, equipoNombre })

    // Load club players if not loaded
    if (jugadoresClub.length === 0) {
      try {
        const jugadores = user?.role === 'productor' ? await getJugadoresProductor() : await getJugadores()
        setJugadoresClub(jugadores)
      } catch {
        // Silently fail, user will see empty list
      }
    }
  }

  const getJugadoresFiltrados = () => {
    if (!showModalAgregarJugador) return []
    const yaAgregados = jugadoresPorEquipo[showModalAgregarJugador.equipoId] || []
    const disponibles = jugadoresClub.filter(j => !yaAgregados.some(ya => ya.jugador_id === j.id))

    if (!busquedaJugador.trim()) return disponibles

    const termino = busquedaJugador.toLowerCase().trim()
    return disponibles.filter(j =>
      j.nombre.toLowerCase().includes(termino) ||
      j.apellido.toLowerCase().includes(termino) ||
      `${j.nombre} ${j.apellido}`.toLowerCase().includes(termino) ||
      (j.dni && j.dni.includes(termino))
    )
  }

  const toggleJugadorSeleccionado = (jugadorId: string) => {
    setJugadoresSeleccionados(prev =>
      prev.includes(jugadorId) ? prev.filter(id => id !== jugadorId) : [...prev, jugadorId]
    )
  }

  const handleAgregarJugadores = async () => {
    if (!showModalAgregarJugador) return

    if (jugadoresSeleccionados.length === 0) {
      setErrors({ jugador_id: 'Seleccioná al menos un jugador' })
      return
    }

    try {
      setSubmitting(true)
      const nuevosJugadores: JugadorEquipoTorneo[] = []

      for (const jugadorId of jugadoresSeleccionados) {
        const nuevo = await agregarJugadorEquipoTorneo(torneoId, showModalAgregarJugador.equipoId, { jugador_id: jugadorId })
        nuevosJugadores.push(nuevo)
      }

      setJugadoresPorEquipo(prev => ({
        ...prev,
        [showModalAgregarJugador.equipoId]: [...(prev[showModalAgregarJugador.equipoId] || []), ...nuevosJugadores],
      }))
      setShowModalAgregarJugador(null)
      setNotification({
        open: true,
        title: 'Jugadores agregados',
        message: `Se agregaron ${nuevosJugadores.length} jugador${nuevosJugadores.length > 1 ? 'es' : ''} al equipo`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al agregar jugadores',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuitarJugador = async () => {
    if (!showConfirmQuitarJugador) return

    try {
      await quitarJugadorEquipoTorneo(torneoId, showConfirmQuitarJugador.equipoId, showConfirmQuitarJugador.jugador.jugador_id)
      setJugadoresPorEquipo(prev => ({
        ...prev,
        [showConfirmQuitarJugador.equipoId]: (prev[showConfirmQuitarJugador.equipoId] || []).filter(
          j => j.jugador_id !== showConfirmQuitarJugador.jugador.jugador_id
        ),
      }))
      const nombre = showConfirmQuitarJugador.jugador.nombre_completo
      setShowConfirmQuitarJugador(null)
      setNotification({
        open: true,
        title: 'Jugador quitado',
        message: `${nombre} fue quitado del equipo`,
        type: 'success'
      })
    } catch (error) {
      setShowConfirmQuitarJugador(null)
      setNotification({
        open: true,
        title: 'Error al quitar jugador',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    }
  }

  // PDF Functions
  const handleOpenModalPDF = async () => {
    // Pre-load all team players before opening the modal
    setGenerandoPDF(true)

    const equiposSinJugadores = inscripciones.filter(i => !jugadoresPorEquipo[i.equipo_id])
    if (equiposSinJugadores.length > 0) {
      try {
        const promises = equiposSinJugadores.map(async (insc) => {
          const jugadores = await getJugadoresEquipoTorneo(torneoId, insc.equipo_id)
          return { equipoId: insc.equipo_id, jugadores }
        })
        const results = await Promise.all(promises)
        const newJugadores: Record<string, typeof jugadoresPorEquipo[string]> = {}
        results.forEach(r => { newJugadores[r.equipoId] = r.jugadores })
        setJugadoresPorEquipo(prev => ({ ...prev, ...newJugadores }))
      } catch (error) {
        setNotification({
          open: true,
          title: 'Error al cargar jugadores',
          message: error instanceof Error ? error.message : 'Error desconocido',
          type: 'error'
        })
        setGenerandoPDF(false)
        return
      }
    }

    setEquiposParaPDF(inscripciones.map(i => i.equipo_id))
    setGenerandoPDF(false)
    setShowModalPDF(true)
  }

  const toggleEquipoPDF = (equipoId: string) => {
    setEquiposParaPDF(prev =>
      prev.includes(equipoId) ? prev.filter(id => id !== equipoId) : [...prev, equipoId]
    )
  }

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
    } catch {
      return ''
    }
  }

  const handleGenerarPDF = async () => {
    if (equiposParaPDF.length === 0) {
      setNotification({
        open: true,
        title: 'Sin equipos seleccionados',
        message: 'Seleccioná al menos un equipo para generar el PDF',
        type: 'error'
      })
      return
    }

    try {
      setGenerandoPDF(true)

      const html2pdf = (await import('html2pdf.js')).default

      // Load logos in parallel
      const [logoLeft, logoCenter, logoRight] = await Promise.all([
        loadLogoBase64('/logos/lucas-segura.png'),
        loadLogoBase64('/logos/complejo-deportivo.png'),
        loadLogoBase64('/logos/bbva-seguros.png'),
      ])

      // Current date formatted
      const hoy = new Date()
      const fecha = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`

      const logoLeftImg = logoLeft ? `<img src="${logoLeft}" style="height:48px;width:auto;">` : ''
      const logoCenterImg = logoCenter ? `<img src="${logoCenter}" style="height:80px;width:auto;">` : ''
      const logoRightImg = logoRight ? `<img src="${logoRight}" style="height:38px;width:auto;">` : ''

      const thStyle = 'color:#fff;font-weight:700;text-transform:uppercase;padding:5px 6px;text-align:center;font-size:9.5px;letter-spacing:0.3px;border:1px solid #2d2d2d;'
      const tdBase = 'padding:4px 6px;text-align:center;vertical-align:middle;border:1px solid #bbb;font-size:10px;'

      // Build one page section per team
      const pages: string[] = []
      for (let idx = 0; idx < equiposParaPDF.length; idx++) {
        const equipoId = equiposParaPDF[idx]
        const inscripcion = inscripciones.find(i => i.equipo_id === equipoId)
        if (!inscripcion) continue

        const jugadoresEquipo = jugadoresPorEquipo[equipoId] || []
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

        const pageBreak = idx < equiposParaPDF.length - 1 ? 'page-break-after: always;' : ''

        pages.push(`
          <div style="font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #000; width: 100%; ${pageBreak}">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <div>${logoLeftImg}</div>
              <div>${logoCenterImg}</div>
              <div>${logoRightImg}</div>
            </div>
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
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>`)
      }

      const html = pages.join('')

      const container = document.createElement('div')
      container.innerHTML = html

      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: 'listado-equipos.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css'] },
        })
        .from(container)
        .save()

      setShowModalPDF(false)
      setNotification({
        open: true,
        title: 'PDF generado',
        message: 'El listado de equipos fue descargado exitosamente',
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al generar PDF',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setGenerandoPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (!torneo) return null

  const estadoCalculado = calcularEstado(torneo)
  const estadoBadge = getEstadoBadge(estadoCalculado)
  const inscripcionesEfectivas = getInscripcionesEfectivas()
  const hoyStr = new Date().toISOString().split('T')[0]
  const inscripcionVencida = torneo.inscripcion_fin && hoyStr > torneo.inscripcion_fin

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm mb-1"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">{torneo.nombre}</h1>
            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border flex items-center gap-1.5 whitespace-nowrap ${estadoBadge.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${estadoBadge.dot} ${estadoCalculado === 'en_curso' ? 'animate-pulse' : ''}`} />
              {getEstadoLabel(estadoCalculado)}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">event</span>
            {formatDate(torneo.fecha_inicio)} - {formatDate(torneo.fecha_fin)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenEditar}
            className="p-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Editar torneo"
          >
            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">edit</span>
          </button>
          <button
            onClick={() => setShowConfirmEliminarTorneo(true)}
            className="p-3 bg-slate-200 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Eliminar torneo"
          >
            <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300 hover:text-red-500">delete</span>
          </button>
          {inscripciones.length > 0 && (
            <button
              onClick={handleOpenModalPDF}
              className="flex-1 md:flex-none px-6 h-12 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
              Descargar PDF
            </button>
          )}
          <button
            onClick={handleOpenModalInscripcion}
            className="flex-1 md:flex-none px-6 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-xl">group_add</span>
            Inscribir equipo
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Gradient header area (no image) */}
            <div className="h-32 w-full relative bg-gradient-to-br from-primary/20 via-primary/10 to-slate-100 dark:from-primary/30 dark:via-slate-800 dark:to-slate-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-primary/30">emoji_events</span>
              </div>
              <div className="absolute bottom-4 left-6">
                <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                  Torneo Oficial
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Información del torneo</h3>
                {torneo.descripcion && (
                  <p className="text-slate-500 dark:text-slate-400">{torneo.descripcion}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {(torneo.inscripcion_inicio || torneo.inscripcion_fin) && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight">Inscripción</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {torneo.inscripcion_inicio ? formatDate(torneo.inscripcion_inicio) : '—'} - {torneo.inscripcion_fin ? formatDate(torneo.inscripcion_fin) : '—'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tight">Capacidad Máx.</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{torneo.max_jugadores_por_equipo} Jugadores por equipo</p>
                  </div>
                </div>
              </div>

              {/* Categorías */}
              {torneo.categorias && torneo.categorias.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {torneo.categorias.map((cat) => (
                    <div
                      key={cat.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl"
                    >
                      <span className="material-symbols-outlined text-sm">label</span>
                      <span className="text-sm font-bold">Categoría: {cat.nombre}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Teams Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Equipos inscritos
                <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-sm">{inscripciones.length}</span>
              </h3>
            </div>

            {inscripciones.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">groups</span>
                <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm">No hay equipos inscritos</p>
                <p className="mt-1 text-slate-400 dark:text-slate-500 text-xs">Inscribí equipos para que puedan participar del torneo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inscripciones.map((inscripcion) => {
                  const isExpanded = expandedEquipo === inscripcion.equipo_id
                  const jugadores = jugadoresPorEquipo[inscripcion.equipo_id] || []
                  const isLoadingJugadores = loadingJugadores === inscripcion.equipo_id

                  return (
                    <div
                      key={inscripcion.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary/50 transition-all"
                    >
                      {/* Header del equipo */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => handleToggleEquipo(inscripcion.equipo_id)}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary border border-slate-200 dark:border-slate-700">
                            <span className="material-symbols-outlined text-3xl">shield</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{inscripcion.equipo_nombre}</h4>
                            <span className="text-xs font-bold text-slate-500 uppercase">{inscripcion.categoria_nombre}</span>
                            {jugadoresPorEquipo[inscripcion.equipo_id] && (
                              <span className="text-xs text-slate-400 ml-2">
                                · {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowConfirmDesinscribir({ id: inscripcion.id, nombre: inscripcion.equipo_nombre }) }}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                          <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </div>
                      </div>

                      {/* Panel expandible de jugadores */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30">
                          {isLoadingJugadores ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Cargando jugadores...</span>
                            </div>
                          ) : (
                            <>
                              {jugadores.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">
                                  No hay jugadores agregados a este equipo
                                </p>
                              ) : (
                                <div className="space-y-2 mb-3">
                                  {jugadores.map((jugador) => (
                                    <div
                                      key={jugador.id}
                                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                    >
                                      <div className="flex items-center gap-3">
                                        {jugador.foto_url ? (
                                          <img
                                            src={jugador.foto_url}
                                            alt={jugador.nombre_completo}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {jugador.nombre_completo}
                                            {jugador.capitan && (
                                              <span className="ml-1.5 text-xs font-semibold text-amber-500">(C)</span>
                                            )}
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {[
                                              jugador.posicion,
                                              jugador.numero_camiseta != null ? `#${jugador.numero_camiseta}` : null,
                                            ].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => setShowConfirmQuitarJugador({ equipoId: inscripcion.equipo_id, jugador })}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-base text-slate-400 hover:text-red-500">close</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenAgregarJugador(inscripcion.equipo_id, inscripcion.equipo_nombre) }}
                                className="w-full px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Agregar jugador
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Side Panel */}
        <div className="space-y-6">
          {/* Registration Toggle Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-bold text-lg text-slate-900 dark:text-white">Inscripciones</p>
                <p className={`text-sm font-medium ${inscripcionesEfectivas ? 'text-emerald-500' : 'text-red-500'}`}>
                  {inscripcionesEfectivas ? 'Abiertas' : 'Cerradas'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleInscripciones}
                disabled={togglingInscripciones}
                className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full p-0.5 transition-colors focus:outline-none disabled:cursor-not-allowed ${
                  inscripcionesEfectivas ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <div className={`h-full w-[27px] rounded-full shadow-sm transition-transform ${
                  inscripcionesEfectivas
                    ? 'translate-x-[20px] bg-white'
                    : 'translate-x-0 bg-slate-400 dark:bg-slate-600'
                }`} />
              </button>
            </div>
            {inscripcionVencida && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
                <span className="material-symbols-outlined text-sm">info</span>
                Fecha de cierre vencida
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal inscribir equipo */}
      {showModalInscripcion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalInscripcion(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Inscribir equipo al torneo
            </h3>

            <div className="space-y-4">
              {/* Primero la categoría */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formInscripcion.categoria_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, categoria_id: e.target.value, equipo_id: '' }))}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    errors.categoria_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {(torneo?.categorias && torneo.categorias.length > 0
                    ? categorias.filter(cat => torneo.categorias!.some(tc => tc.id === cat.id))
                    : categorias
                  ).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                {errors.categoria_id && <p className="text-red-400 text-xs mt-1">{errors.categoria_id}</p>}
              </div>

              {/* Luego el equipo, filtrado por categoría */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Equipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formInscripcion.equipo_id}
                  onChange={(e) => setFormInscripcion(prev => ({ ...prev, equipo_id: e.target.value }))}
                  disabled={!formInscripcion.categoria_id}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.equipo_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  <option value="">{formInscripcion.categoria_id ? 'Seleccionar equipo' : 'Primero seleccioná una categoría'}</option>
                  {formInscripcion.categoria_id && equiposDisponibles
                    .filter(e => e.activo && e.categorias?.some(c => c.id === formInscripcion.categoria_id))
                    .map(equipo => (
                      <option key={equipo.id} value={equipo.id}>
                        {equipo.nombre}
                      </option>
                    ))}
                </select>
                {errors.equipo_id && <p className="text-red-400 text-xs mt-1">{errors.equipo_id}</p>}
                {formInscripcion.categoria_id && equiposDisponibles.filter(e => e.activo && e.categorias?.some(c => c.id === formInscripcion.categoria_id)).length === 0 && (
                  <p className="text-amber-500 text-xs mt-1">
                    No hay equipos asignados a esta categoría. Asigná equipos desde la sección de Equipos.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-medium">Nota:</span> Solo se muestran equipos que pertenecen a la categoría seleccionada. Podés asignar categorías a equipos desde la sección de Equipos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModalInscripcion(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleInscribir}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Inscribiendo...
                  </>
                ) : (
                  'Inscribir equipo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación desinscribir */}
      {showConfirmDesinscribir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmDesinscribir(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Desinscribir equipo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de desinscribir a <span className="font-semibold text-slate-900 dark:text-white">&quot;{showConfirmDesinscribir.nombre}&quot;</span> del torneo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDesinscribir(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesinscribir}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Desinscribir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar torneo */}
      {showConfirmEliminarTorneo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { if (!submitting) { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') } }}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Eliminar torneo</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              ¿Estás seguro de eliminar el torneo <span className="font-semibold text-slate-900 dark:text-white">&quot;{torneo.nombre}&quot;</span>? Ya no será visible para el club ni los jugadores.
            </p>
            <div className="mb-5">
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError('') }}
                placeholder="Ingresá tu contraseña"
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary ${
                  deleteError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {deleteError && <p className="text-red-400 text-xs mt-1">{deleteError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmEliminarTorneo(false); setDeletePassword(''); setDeleteError('') }}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarTorneo}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando...
                  </>
                ) : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar jugadores al equipo */}
      {showModalAgregarJugador && (() => {
        const jugadoresFiltrados = getJugadoresFiltrados()
        const todosSeleccionados = jugadoresFiltrados.length > 0 && jugadoresFiltrados.every(j => jugadoresSeleccionados.includes(j.id))

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalAgregarJugador(null)}>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Agregar jugadores a {showModalAgregarJugador.equipoNombre}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Seleccioná los jugadores que querés agregar al plantel
              </p>

              {/* Buscador */}
              <div className="relative mb-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  value={busquedaJugador}
                  onChange={(e) => setBusquedaJugador(e.target.value)}
                  placeholder="Buscar por nombre o DNI..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Seleccionar todos */}
              {jugadoresFiltrados.length > 0 && (
                <label className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-primary/5 dark:bg-primary/10 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-primary/20">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={() => {
                      if (todosSeleccionados) {
                        setJugadoresSeleccionados(prev => prev.filter(id => !jugadoresFiltrados.some(j => j.id === id)))
                      } else {
                        const nuevosIds = jugadoresFiltrados.map(j => j.id)
                        setJugadoresSeleccionados(prev => [...new Set([...prev, ...nuevosIds])])
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-primary">
                    {todosSeleccionados ? 'Deseleccionar todos' : `Seleccionar todos (${jugadoresFiltrados.length})`}
                  </span>
                </label>
              )}

              {/* Lista de jugadores */}
              <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
                {jugadoresFiltrados.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-6">
                    {busquedaJugador ? 'No se encontraron jugadores' : 'No hay jugadores disponibles'}
                  </p>
                ) : (
                  jugadoresFiltrados.map((j) => (
                    <label
                      key={j.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        jugadoresSeleccionados.includes(j.id)
                          ? 'bg-slate-100 dark:bg-slate-700'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={jugadoresSeleccionados.includes(j.id)}
                        onChange={() => toggleJugadorSeleccionado(j.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {j.apellido}, {j.nombre}
                        </p>
                        {j.dni && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            DNI: {j.dni}
                          </p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {errors.jugador_id && <p className="text-red-400 text-xs mb-3">{errors.jugador_id}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModalAgregarJugador(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarJugadores}
                  disabled={submitting || jugadoresSeleccionados.length === 0}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      Agregar ({jugadoresSeleccionados.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Modal confirmación quitar jugador */}
      {showConfirmQuitarJugador && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowConfirmQuitarJugador(null)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">person_remove</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quitar jugador</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              ¿Estás seguro de quitar a <span className="font-semibold text-slate-900 dark:text-white">&quot;{showConfirmQuitarJugador.jugador.nombre_completo}&quot;</span> del equipo?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmQuitarJugador(null)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuitarJugador}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar torneo */}
      {showModalEditar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !submitting && setShowModalEditar(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Editar torneo
            </h3>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Nombre del torneo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formEditar.nombre || ''}
                  onChange={(e) => setFormEditar(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary ${
                    editErrors.nombre ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {editErrors.nombre && <p className="text-red-400 text-xs mt-1">{editErrors.nombre}</p>}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={formEditar.descripcion || ''}
                  onChange={(e) => setFormEditar(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Fechas del torneo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Fecha inicio <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formEditar.fecha_inicio || ''}
                    onChange={(val) => setFormEditar(prev => ({ ...prev, fecha_inicio: val }))}
                    placeholder="Fecha inicio"
                    hasError={!!editErrors.fecha_inicio}
                  />
                  {editErrors.fecha_inicio && <p className="text-red-400 text-xs mt-1">{editErrors.fecha_inicio}</p>}
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Fecha fin <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formEditar.fecha_fin || ''}
                    onChange={(val) => setFormEditar(prev => ({ ...prev, fecha_fin: val }))}
                    placeholder="Fecha fin"
                    hasError={!!editErrors.fecha_fin}
                  />
                  {editErrors.fecha_fin && <p className="text-red-400 text-xs mt-1">{editErrors.fecha_fin}</p>}
                </div>
              </div>

              {/* Período de inscripción */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                  Período de inscripción
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    value={formEditar.inscripcion_inicio || ''}
                    onChange={(val) => setFormEditar(prev => ({ ...prev, inscripcion_inicio: val }))}
                    placeholder="Apertura"
                  />
                  <DatePicker
                    value={formEditar.inscripcion_fin || ''}
                    onChange={(val) => setFormEditar(prev => ({ ...prev, inscripcion_fin: val }))}
                    placeholder="Cierre"
                  />
                </div>
              </div>

              {/* Categorías */}
              {categorias.length > 0 && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Categorías del torneo
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categorias.map((cat) => (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          formEditar.categoria_ids?.includes(cat.id)
                            ? 'border-primary bg-primary/10 dark:bg-primary/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formEditar.categoria_ids?.includes(cat.id) || false}
                          onChange={() => toggleCategoriaEditar(cat.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{cat.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModalEditar(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal descargar PDF */}
      {showModalPDF && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => !generandoPDF && setShowModalPDF(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Descargar PDF de planteles
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Seleccioná los equipos para generar sus planillas de jugadores
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {/* Select all */}
              <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 dark:bg-primary/10 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-primary/20">
                <input
                  type="checkbox"
                  checked={equiposParaPDF.length === inscripciones.length}
                  onChange={() => {
                    if (equiposParaPDF.length === inscripciones.length) {
                      setEquiposParaPDF([])
                    } else {
                      setEquiposParaPDF(inscripciones.map(i => i.equipo_id))
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                />
                <span className="text-sm font-medium text-primary">
                  {equiposParaPDF.length === inscripciones.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </span>
              </label>

              {/* Team list */}
              {inscripciones.map((insc) => {
                const jugadores = jugadoresPorEquipo[insc.equipo_id] || []
                return (
                  <label
                    key={insc.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      equiposParaPDF.includes(insc.equipo_id)
                        ? 'bg-slate-100 dark:bg-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={equiposParaPDF.includes(insc.equipo_id)}
                      onChange={() => toggleEquipoPDF(insc.equipo_id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {insc.equipo_nombre}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {insc.categoria_nombre} · {jugadores.length} jugador{jugadores.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModalPDF(false)}
                disabled={generandoPDF}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerarPDF}
                disabled={generandoPDF || equiposParaPDF.length === 0}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generandoPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">download</span>
                    Descargar ({equiposParaPDF.length})
                  </>
                )}
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
