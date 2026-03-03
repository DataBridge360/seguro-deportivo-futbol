'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getJugadorTorneos, getJugadorInscripciones, getEquiposTorneo,
  inscribirseEquipo, desinscribirseEquipo,
} from '@/lib/api'
import type { JugadorTorneo, JugadorInscripcion, EquipoTorneo } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatFechaNacimiento(fecha: string | null | undefined): string {
  if (!fecha) return '-'
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
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

  const [torneo, setTorneo] = useState<JugadorTorneo | null>(null)
  const [equipo, setEquipo] = useState<EquipoTorneo | null>(null)
  const [inscripciones, setInscripciones] = useState<JugadorInscripcion[]>([])
  const [loading, setLoading] = useState(true)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [desinscribiendo, setDesinscribiendo] = useState(false)
  const [showConfirmSalir, setShowConfirmSalir] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success',
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [torneosData, inscripcionesData, equiposData] = await Promise.all([
        getJugadorTorneos(),
        getJugadorInscripciones(),
        getEquiposTorneo(torneoId),
      ])
      const t = torneosData.find(t => t.id === torneoId)
      setTorneo(t || null)
      setInscripciones(inscripcionesData)
      const eq = equiposData.find(e => e.id === equipoId)
      setEquipo(eq || null)
    } catch (err: any) {
      setNotification({
        open: true, title: 'Error',
        message: err.message || 'Error al cargar datos', type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [torneoId, equipoId])

  const misInscripcionesTorneo = inscripciones.filter(i => i.torneo_id === torneoId)
  const esMiEquipo = misInscripcionesTorneo.some(i => i.torneo_equipo_id === equipoId)
  const abierto = torneo ? isInscripcionAbierta(torneo) : false

  const handleInscribirse = async () => {
    try {
      setInscribiendo(true)
      await inscribirseEquipo(torneoId, equipoId)
      setNotification({
        open: true, title: 'Inscripcion exitosa',
        message: 'Te inscribiste correctamente al equipo', type: 'success',
      })
      await fetchData()
    } catch (err: any) {
      setNotification({
        open: true, title: 'Error al inscribirse',
        message: err.message || 'No se pudo completar la inscripcion', type: 'error',
      })
    } finally {
      setInscribiendo(false)
    }
  }

  const handleDesinscribirse = async () => {
    try {
      setDesinscribiendo(true)
      await desinscribirseEquipo(torneoId, equipoId)
      setShowConfirmSalir(false)
      setNotification({
        open: true, title: 'Desinscripcion exitosa',
        message: 'Saliste del equipo correctamente', type: 'success',
      })
      await fetchData()
    } catch (err: any) {
      setShowConfirmSalir(false)
      setNotification({
        open: true, title: 'Error',
        message: err.message || 'No se pudo completar la desinscripcion', type: 'error',
      })
    } finally {
      setDesinscribiendo(false)
    }
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
          <td style="${tdBase}">${formatFechaNacimiento(j.fecha_nacimiento)}</td>
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
        const imgData = canvas.toDataURL('image/jpeg', 0.95)
        const imgHeight = (canvas.height * contentWidthMM) / canvas.width

        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
        pdf.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, Math.min(imgHeight, maxContentHeightMM))

        const fileName = `${equipo.equipo_nombre.toLowerCase().replace(/\s+/g, '-')}-planilla.pdf`
        pdf.save(fileName)

        setNotification({ open: true, title: 'PDF generado', message: 'Descargado exitosamente', type: 'success' })
      } finally {
        document.body.removeChild(container)
      }
    } catch (error) {
      setNotification({
        open: true, title: 'Error al generar PDF',
        message: error instanceof Error ? error.message : 'Error desconocido', type: 'error',
      })
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Volver
        </button>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">error</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">Equipo no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Volver al torneo
      </button>

      {/* Team header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">shield</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{equipo.equipo_nombre}</h1>
              {esMiEquipo && (
                <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary whitespace-nowrap">Mi equipo</span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{equipo.categoria_nombre}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{torneo.nombre}</p>
            <div className={`flex items-center gap-1.5 text-xs mt-2 ${abierto ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
              <span className="material-symbols-outlined text-sm">{abierto ? 'check_circle' : 'block'}</span>
              <span>
                {abierto
                  ? `Inscripciones abiertas${torneo.inscripcion_fin ? ` hasta ${formatDate(torneo.inscripcion_fin)}` : ''}`
                  : 'Inscripciones cerradas'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons - single row */}
        <div className="flex items-center gap-2 mt-4">
          {abierto && !esMiEquipo && (
            <button
              onClick={handleInscribirse}
              disabled={inscribiendo}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors active:scale-[0.97] disabled:opacity-50"
            >
              {inscribiendo ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Inscribiendo...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">group_add</span>
                  Unirme
                </>
              )}
            </button>
          )}

          {esMiEquipo && abierto && (
            <button
              onClick={() => setShowConfirmSalir(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Salir del equipo
            </button>
          )}

          {equipo.jugadores.length > 0 && (
            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ml-auto"
            >
              {generandoPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                  Planilla
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Player list */}
      <div>
        <h2 className="text-sm font-bold text-[#617989] dark:text-slate-400 uppercase tracking-wider mb-3">
          Jugadores ({equipo.jugadores.length})
        </h2>

        {equipo.jugadores.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-2">group</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">No hay jugadores en este equipo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {equipo.jugadores.map((jugador) => (
              <div
                key={jugador.id}
                className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg text-slate-400">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {jugador.apellido}, {jugador.nombre}
                    </p>
                    {jugador.capitan && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 shrink-0">C</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {jugador.numero_camiseta != null && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">#{jugador.numero_camiseta}</span>
                    )}
                    {jugador.posicion && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{jugador.posicion}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmar salir del equipo */}
      {showConfirmSalir && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => !desinscribiendo && setShowConfirmSalir(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-2xl">group_remove</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              Salir del equipo
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Vas a salir de <span className="font-semibold text-slate-700 dark:text-slate-300">{equipo.equipo_nombre}</span>. Podras volver a inscribirte mientras las inscripciones sigan abiertas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSalir(false)}
                disabled={desinscribiendo}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesinscribirse}
                disabled={desinscribiendo}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {desinscribiendo ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saliendo...
                  </>
                ) : (
                  'Salir'
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
