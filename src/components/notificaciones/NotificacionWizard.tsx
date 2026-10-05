'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createNotificacion,
  getEquipos,
  getTorneos,
  getCategorias,
  CreateNotificacionData,
  CouponColor,
} from '@/lib/api'
import type { Equipo, Torneo, Categoria } from '@/types/club'
import DatePicker from '@/components/ui/DatePicker'

type TipoDestinatario = CreateNotificacionData['tipo_filtro']

const audienceOptions: {
  value: TipoDestinatario
  label: string
  helper: string
  icon: string
  tint: string
  needsFilter: boolean
}[] = [
  { value: 'todos', label: 'Todos', helper: 'Todos los jugadores del club', icon: 'groups', tint: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300', needsFilter: false },
  { value: 'equipo', label: 'Un equipo', helper: 'Solo los jugadores de un equipo', icon: 'sports_soccer', tint: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400', needsFilter: true },
  { value: 'categoria', label: 'Una categoría', helper: 'Jugadores de una categoría', icon: 'category', tint: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300', needsFilter: true },
  { value: 'torneo', label: 'Un torneo', helper: 'Jugadores que juegan un torneo', icon: 'emoji_events', tint: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400', needsFilter: true },
  { value: 'seguro_vigente', label: 'Con seguro vigente', helper: 'Los que tienen el seguro al día', icon: 'verified_user', tint: 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400', needsFilter: false },
  { value: 'seguro_vencido', label: 'Con seguro vencido', helper: 'Los que tienen que renovar', icon: 'gpp_bad', tint: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400', needsFilter: false },
]

const filterNoun: Record<string, { stepLabel: string; question: string; placeholder: string; empty: string; icon: string }> = {
  equipo: { stepLabel: 'Equipo', question: '¿Qué equipo?', placeholder: 'Buscá un equipo', empty: 'No encontramos equipos', icon: 'sports_soccer' },
  categoria: { stepLabel: 'Categoría', question: '¿Qué categoría?', placeholder: 'Buscá una categoría', empty: 'No encontramos categorías', icon: 'category' },
  torneo: { stepLabel: 'Torneo', question: '¿Qué torneo?', placeholder: 'Buscá un torneo', empty: 'No encontramos torneos', icon: 'emoji_events' },
}

const ASUNTO_MAX = 80
const MENSAJE_MAX = 500
const TITULO_CUPON_MAX = 60

const couponColorOptions: { value: CouponColor; label: string; swatch: string; preview: string; active: string }[] = [
  { value: 'amber', label: 'Amarillo', swatch: 'bg-amber-500', preview: 'from-amber-400 via-amber-500 to-orange-500 shadow-amber-500/20', active: 'ring-amber-500 border-amber-400' },
  { value: 'blue', label: 'Azul', swatch: 'bg-blue-500', preview: 'from-blue-500 via-sky-500 to-cyan-500 shadow-blue-500/20', active: 'ring-blue-500 border-blue-400' },
  { value: 'green', label: 'Verde', swatch: 'bg-green-500', preview: 'from-green-500 via-emerald-500 to-teal-500 shadow-green-500/20', active: 'ring-green-500 border-green-400' },
  { value: 'red', label: 'Rojo', swatch: 'bg-red-500', preview: 'from-red-500 via-rose-500 to-pink-500 shadow-red-500/20', active: 'ring-red-500 border-red-400' },
  { value: 'purple', label: 'Violeta', swatch: 'bg-purple-500', preview: 'from-purple-500 via-violet-500 to-fuchsia-500 shadow-purple-500/20', active: 'ring-purple-500 border-purple-400' },
]

type StepId = 'audiencia' | 'filtro' | 'mensaje' | 'cupon' | 'revisar' | 'enviada'

function getCouponColor(value: CouponColor) {
  return couponColorOptions.find(option => option.value === value) || couponColorOptions[0]
}

// Argentina has no DST, so a fixed -03:00 offset is the club's local time.
function toInstant(date: string, time: string): string {
  return `${date}T${time}:00-03:00`
}

function formatVentana(date: string, time: string): string {
  const [, m, d] = date.split('-')
  return `${d}/${m} ${time}`
}

function formatDescuento(tipo: 'porcentaje' | 'monto_fijo', valor: number): string {
  if (tipo === 'porcentaje') return `${Math.min(Math.round(valor), 100)}%`
  return `$${Math.round(valor).toLocaleString('es-AR')}`
}

// Accent- and case-insensitive normalization for searching
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const inputBase =
  'w-full px-4 min-h-[48px] py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-base sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50'
const inputBorderOk = 'border-slate-200 dark:border-slate-700'
const inputBorderErr = 'border-red-400/70 focus:ring-red-400/30 focus:border-red-400'
const labelClass = 'block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wide'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">error</span>
      {message}
    </p>
  )
}

interface NotificacionWizardProps {
  onSent?: () => void
  // Closes the wizard; when provided, a "Cancelar" button is shown in the action bar
  onCancel?: () => void
}

export default function NotificacionWizard({ onSent, onCancel }: NotificacionWizardProps) {
  const [step, setStep] = useState<StepId>('audiencia')
  const searchRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const prevStep = useRef<StepId>(step)
  const [tipoDestinatario, setTipoDestinatario] = useState<TipoDestinatario | ''>('')
  const [filtroId, setFiltroId] = useState('')
  const [filtroSearch, setFiltroSearch] = useState('')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [incluirCupon, setIncluirCupon] = useState(false)
  const [tipoCupon, setTipoCupon] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [valorCupon, setValorCupon] = useState('')
  const [tituloCupon, setTituloCupon] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [horaDesde, setHoraDesde] = useState('00:00')
  const [fechaHasta, setFechaHasta] = useState('')
  const [horaHasta, setHoraHasta] = useState('23:59')
  const [stockCupon, setStockCupon] = useState('')
  const [soloNuevos, setSoloNuevos] = useState(false)
  const [colorCupon, setColorCupon] = useState<CouponColor>('amber')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sentCount, setSentCount] = useState<number | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    getEquipos().then(setEquipos).catch(() => {})
    getTorneos().then(setTorneos).catch(() => {})
    getCategorias().then(setCategorias).catch(() => {})
  }, [])

  const audience = audienceOptions.find(o => o.value === tipoDestinatario)
  const needsFilter = !!audience?.needsFilter

  const filterItems: { id: string; nombre: string }[] = useMemo(() => {
    if (tipoDestinatario === 'equipo') return equipos
    if (tipoDestinatario === 'torneo') return torneos
    if (tipoDestinatario === 'categoria') return categorias
    return []
  }, [tipoDestinatario, equipos, torneos, categorias])

  const filteredItems = useMemo(() => {
    const q = normalize(filtroSearch)
    if (!q) return filterItems
    return filterItems.filter(item => normalize(item.nombre).includes(q))
  }, [filterItems, filtroSearch])

  const selectedFilterName = filterItems.find(i => String(i.id) === filtroId)?.nombre

  const ventanaCompleta = !!(fechaDesde && horaDesde && fechaHasta && horaHasta)
  const desdeMs = ventanaCompleta ? new Date(toInstant(fechaDesde, horaDesde)).getTime() : 0
  const hastaMs = ventanaCompleta ? new Date(toInstant(fechaHasta, horaHasta)).getTime() : 0
  const vigenciaError = !incluirCupon
    ? ''
    : !ventanaCompleta
    ? 'Indicá desde y hasta cuándo vale el cupón'
    : hastaMs <= desdeMs
    ? 'El fin tiene que ser después del inicio'
    : hastaMs <= Date.now()
    ? 'El fin ya pasó'
    : ''

  // Same validations as the previous form, split by step
  const errors = {
    tipoDestinatario: !tipoDestinatario ? 'Elegí a quién le vas a escribir' : '',
    filtroId: needsFilter && !filtroId ? 'Elegí una opción de la lista' : '',
    asunto: !asunto.trim() ? 'El asunto es obligatorio' : '',
    mensaje: !mensaje.trim() ? 'El mensaje es obligatorio' : '',
    tituloCupon: incluirCupon && !tituloCupon.trim() ? 'El título del cupón es obligatorio' : '',
    valorCupon: incluirCupon && (!valorCupon || parseFloat(valorCupon) <= 0) ? 'El valor del cupón es obligatorio' : '',
    vigencia: vigenciaError,
  }
  const stepValid: Record<StepId, boolean> = {
    audiencia: !errors.tipoDestinatario,
    filtro: !errors.filtroId,
    mensaje: !errors.asunto && !errors.mensaje,
    cupon: !errors.tituloCupon && !errors.valorCupon && !errors.vigencia,
    revisar: true,
    enviada: true,
  }
  const shown = (field: keyof typeof errors) => (touched[field] ? errors[field] : '')
  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }))

  const cuponValorNum = valorCupon ? parseInt(valorCupon, 10) : 0
  const cuponValorTexto = cuponValorNum > 0 ? formatDescuento(tipoCupon, cuponValorNum) : '—'
  const cuponFechaTexto = ventanaCompleta
    ? `Del ${formatVentana(fechaDesde, horaDesde)} al ${formatVentana(fechaHasta, horaHasta)}`
    : 'Sin vigencia'
  const stockNum = stockCupon ? parseInt(stockCupon, 10) : 0
  const cuponExtrasTexto = [
    stockNum > 0 ? `${stockNum.toLocaleString('es-AR')} disponibles` : '',
    soloNuevos ? 'Solo nuevos registros' : '',
  ].filter(Boolean).join(' · ')
  const cuponColor = getCouponColor(colorCupon)

  const audienceSummary = audience
    ? needsFilter
      ? `${audience.label}: ${selectedFilterName || '—'}`
      : audience.label
    : '—'

  // The filter step only exists when the chosen audience needs one
  const steps: { id: StepId; label: string }[] = [
    { id: 'audiencia', label: 'Para quién' },
    ...(needsFilter && tipoDestinatario ? [{ id: 'filtro' as const, label: filterNoun[tipoDestinatario].stepLabel }] : []),
    { id: 'mensaje', label: 'Mensaje' },
    { id: 'cupon', label: 'Cupón' },
    { id: 'revisar', label: 'Revisar' },
  ]
  const stepIndex = Math.max(0, steps.findIndex(s => s.id === step))

  const goNext = () => {
    if (!stepValid[step]) {
      if (step === 'audiencia') touch('tipoDestinatario')
      if (step === 'filtro') touch('filtroId')
      if (step === 'mensaje') { touch('asunto'); touch('mensaje') }
      if (step === 'cupon') { touch('tituloCupon'); touch('valorCupon'); touch('vigencia') }
      return
    }
    setStep(steps[Math.min(steps.length - 1, stepIndex + 1)].id)
  }

  // Focus the search only where there is a physical keyboard; on touch devices it would pop the keyboard over the list
  useEffect(() => {
    if (step === 'filtro' && window.matchMedia('(pointer: fine)').matches) searchRef.current?.focus()
  }, [step])

  // Bring the wizard back into view when the step changes so the user is not left mid-page
  useEffect(() => {
    if (prevStep.current === step) return
    prevStep.current = step
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    wrapperRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }, [step])

  const goBack = () => setStep(steps[Math.max(0, stepIndex - 1)].id)

  const selectFilter = (id: string) => {
    setFiltroId(id)
    setStep(steps[Math.min(steps.length - 1, stepIndex + 1)].id)
  }

  const skipCoupon = () => {
    setIncluirCupon(false)
    setStep('revisar')
  }

  const reset = () => {
    setStep('audiencia')
    setTipoDestinatario('')
    setFiltroId('')
    setFiltroSearch('')
    setAsunto('')
    setMensaje('')
    setIncluirCupon(false)
    setTipoCupon('porcentaje')
    setValorCupon('')
    setTituloCupon('')
    setFechaDesde('')
    setHoraDesde('00:00')
    setFechaHasta('')
    setHoraHasta('23:59')
    setStockCupon('')
    setSoloNuevos(false)
    setColorCupon('amber')
    setSendError('')
    setSentCount(null)
    setTouched({})
  }

  // Anything the user typed that would be lost by closing the wizard
  const hasProgress = !!(
    asunto.trim() || mensaje.trim() || tituloCupon.trim() || valorCupon || stockCupon || fechaDesde || fechaHasta
  )

  const close = () => {
    reset()
    onCancel?.()
  }

  const handleCancel = () => {
    if (sending) return
    if (hasProgress && !window.confirm('¿Descartar esta notificación? Se pierde lo que escribiste.')) return
    close()
  }

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    setSendError('')
    try {
      const data: CreateNotificacionData = {
        titulo: asunto.trim(),
        mensaje: mensaje.trim(),
        tipo_filtro: tipoDestinatario as CreateNotificacionData['tipo_filtro'],
        filtro_id: filtroId || undefined,
        con_cupon: incluirCupon,
      }
      if (incluirCupon) {
        data.cupon = {
          titulo: tituloCupon.trim(),
          tipo_descuento: tipoCupon,
          valor_descuento: parseFloat(valorCupon),
          valido_desde: toInstant(fechaDesde, horaDesde),
          valido_hasta: toInstant(fechaHasta, horaHasta),
          color: colorCupon,
          ...(stockNum > 0 ? { stock: stockNum } : {}),
          ...(soloNuevos ? { solo_nuevos_registros: true } : {}),
        }
      }
      const result = await createNotificacion(data)
      setSentCount(typeof result?.destinatarios_count === 'number' ? result.destinatarios_count : null)
      setStep('enviada')
      onSent?.()
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'No pudimos enviar la notificación')
    } finally {
      setSending(false)
    }
  }

  const sectionCard =
    'bg-white dark:bg-slate-800 rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10 shadow-sm'

  const primaryBtn =
    'flex-1 min-h-[48px] px-5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
  const secondaryBtn =
    'min-h-[48px] px-4 sm:px-5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 ring-1 ring-slate-200 dark:ring-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-colors active:scale-[0.98] flex items-center justify-center gap-1 disabled:opacity-50'

  // ---------- Success ----------
  if (step === 'enviada') {
    return (
      <div ref={wrapperRef} className="scroll-mt-20">
        <div className={`${sectionCard} p-6 text-center py-8`}>
          <div className="size-16 rounded-full bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Listo, enviada!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {incluirCupon && soloNuevos
              ? 'Lo van a ver los jugadores que se registren desde el inicio del cupón.'
              : sentCount !== null
              ? `La notificación le llegó a ${sentCount} ${sentCount === 1 ? 'jugador' : 'jugadores'}.`
              : 'La notificación ya está en camino.'}
            {incluirCupon && ' Cada código del cupón se genera cuando el jugador lo abre.'}
          </p>
          <button type="button" onClick={reset} className={`${primaryBtn} w-full sm:w-auto sm:px-8 mx-auto mt-6`}>
            <span className="material-symbols-outlined text-lg">add</span>
            Enviar otra
          </button>
          {onCancel && (
            <button type="button" onClick={close} className={`${secondaryBtn} w-full sm:w-auto sm:px-8 mx-auto mt-3`}>
              Volver al listado
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="scroll-mt-20 space-y-4">
      {/* Step indicator */}
      <div className={`${sectionCard} px-4 py-3`}>
        <div className="sm:hidden">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Paso {stepIndex + 1} de {steps.length} · <span className="text-primary">{steps[stepIndex].label}</span>
          </p>
          <div
            role="progressbar"
            aria-label="Progreso"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={stepIndex + 1}
            className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
          >
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
        <ol className="hidden sm:flex items-center gap-2">
          {steps.map(({ id, label }, i) => {
            const done = i < stepIndex
            const current = i === stepIndex
            return (
              <li key={id} className="flex-1 min-w-0">
                <div className={`h-1.5 rounded-full transition-colors ${done || current ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                <p className={`mt-1.5 text-xs font-semibold truncate ${current ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                  {i + 1}. {label}
                </p>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Audience */}
      {step === 'audiencia' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">¿Para quién es?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Elegí quién va a recibir la notificación.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {audienceOptions.map(opt => {
              const active = tipoDestinatario === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (opt.value !== tipoDestinatario) {
                      setTipoDestinatario(opt.value)
                      setFiltroId('')
                      setFiltroSearch('')
                    }
                    setTouched(prev => ({ ...prev, tipoDestinatario: false, filtroId: false }))
                  }}
                  aria-pressed={active}
                  className={`relative flex flex-col items-center gap-2 min-h-[124px] rounded-2xl px-2 py-3.5 text-center shadow-sm transition-transform active:scale-[0.98] ${
                    active
                      ? 'bg-primary/5 ring-2 ring-primary dark:bg-primary/10'
                      : 'bg-white ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10'
                  }`}
                >
                  {active && <span className="material-symbols-outlined absolute top-2 right-2 text-primary text-lg">check_circle</span>}
                  <span className={`flex size-11 items-center justify-center rounded-full ${active ? 'bg-primary text-white' : opt.tint}`}>
                    <span className="material-symbols-outlined text-[24px]">{opt.icon}</span>
                  </span>
                  <span className={`text-sm font-semibold leading-tight ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{opt.label}</span>
                  <span className="text-[11px] sm:text-xs leading-tight text-slate-500 dark:text-slate-400">{opt.helper}</span>
                </button>
              )
            })}
          </div>
          <FieldError message={shown('tipoDestinatario')} />
        </section>
      )}

      {/* Filter: team, category or tournament */}
      {step === 'filtro' && needsFilter && tipoDestinatario && audience && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{filterNoun[tipoDestinatario].question}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Tocá una opción y seguimos.</p>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl pointer-events-none">search</span>
            <input
              ref={searchRef}
              type="text"
              value={filtroSearch}
              onChange={(e) => setFiltroSearch(e.target.value)}
              placeholder={filterNoun[tipoDestinatario].placeholder}
              aria-label={filterNoun[tipoDestinatario].placeholder}
              className={`${inputBase} pl-11 ${shown('filtroId') ? inputBorderErr : inputBorderOk}`}
            />
          </div>

          {filteredItems.length === 0 ? (
            <div className={`${sectionCard} px-4 py-8 text-center`}>
              <p className="text-sm text-slate-500 dark:text-slate-400">{filterNoun[tipoDestinatario].empty}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const active = String(item.id) === filtroId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectFilter(String(item.id))}
                    aria-pressed={active}
                    className={`w-full min-h-[56px] flex items-center gap-3 rounded-2xl px-3 py-2 text-left shadow-sm transition-transform active:scale-[0.98] ${
                      active
                        ? 'bg-primary/5 ring-2 ring-primary dark:bg-primary/10'
                        : 'bg-white ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10'
                    }`}
                  >
                    <span className={`flex size-11 items-center justify-center rounded-full flex-shrink-0 ${active ? 'bg-primary text-white' : audience.tint}`}>
                      <span className="material-symbols-outlined text-[24px]">{filterNoun[tipoDestinatario].icon}</span>
                    </span>
                    <span className={`flex-1 min-w-0 truncate text-sm font-semibold ${active ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{item.nombre}</span>
                    {active && <span className="material-symbols-outlined text-primary text-xl">check_circle</span>}
                  </button>
                )
              })}
            </div>
          )}
          <FieldError message={shown('filtroId')} />
        </section>
      )}

      {/* Message */}
      {step === 'mensaje' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">¿Qué querés decirles?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Escribí un asunto corto y el mensaje.</p>
          </div>

          <div className={`${sectionCard} p-4 space-y-4`}>
            <div>
              <label className={labelClass}>Asunto</label>
              <div className="relative">
                <input
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value.slice(0, ASUNTO_MAX))}
                  onBlur={() => touch('asunto')}
                  placeholder="Ej: Se suspende el partido del sábado"
                  className={`${inputBase} pr-16 ${shown('asunto') ? inputBorderErr : inputBorderOk}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                  {asunto.length}/{ASUNTO_MAX}
                </span>
              </div>
              <FieldError message={shown('asunto')} />
            </div>

            <div>
              <label className={labelClass}>Mensaje</label>
              <div className="relative">
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value.slice(0, MENSAJE_MAX))}
                  onBlur={() => touch('mensaje')}
                  placeholder="Escribí el mensaje para los jugadores..."
                  className={`${inputBase} min-h-[140px] pb-7 resize-none ${shown('mensaje') ? inputBorderErr : inputBorderOk}`}
                />
                <span className="absolute right-3 bottom-2.5 text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                  {mensaje.length}/{MENSAJE_MAX}
                </span>
              </div>
              <FieldError message={shown('mensaje')} />
            </div>
          </div>

          {/* Phone preview */}
          <div className={`${sectionCard} p-4`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Así se ve en el celular</p>
            <div className="mx-auto max-w-xs rounded-[2rem] bg-slate-900 dark:bg-slate-950 p-3 shadow-xl">
              <div className="rounded-[1.5rem] bg-gradient-to-b from-slate-700 to-slate-800 px-3 pt-6 pb-8">
                <div className="rounded-2xl bg-white/90 dark:bg-slate-100/95 p-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-primary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">campaign</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex-1">Notificación</span>
                    <span className="text-xs text-slate-500">ahora</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 break-words">{asunto.trim() || 'Asunto de tu notificación'}</p>
                  <p className="text-sm text-slate-700 mt-0.5 break-words line-clamp-4 whitespace-pre-line">
                    {mensaje.trim() || 'Acá va a aparecer el mensaje que escribas.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coupon */}
      {step === 'cupon' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">¿Sumás un cupón?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Es opcional. Podés enviar solo el mensaje.</p>
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl shadow-sm transition-colors ${
              incluirCupon
                ? 'bg-amber-50 ring-1 ring-amber-300/70 dark:bg-amber-500/10 dark:ring-amber-400/30'
                : 'bg-white ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-white/10'
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={incluirCupon}
              onClick={() => setIncluirCupon(v => !v)}
              className="w-full min-h-[72px] flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform"
            >
              <span className={`flex size-11 items-center justify-center rounded-full flex-shrink-0 transition-colors ${
                incluirCupon
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                <span className="material-symbols-outlined text-[24px]">local_offer</span>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-slate-900 dark:text-white text-sm">Incluir cupón de descuento</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Se crea una plantilla; cada código se genera al abrirlo</span>
              </span>
              <span className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${incluirCupon ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${incluirCupon ? 'left-6' : 'left-1'}`} />
              </span>
            </button>

            {incluirCupon && (
              <div className="px-4 pb-4 space-y-4 border-t border-amber-200/60 dark:border-amber-400/15 pt-4">
                <div>
                  <label className={labelClass}>Título del cupón</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tituloCupon}
                      onChange={(e) => setTituloCupon(e.target.value.slice(0, TITULO_CUPON_MAX))}
                      onBlur={() => touch('tituloCupon')}
                      placeholder="Ej: Descuento en cantina"
                      className={`${inputBase} pr-16 ${shown('tituloCupon') ? inputBorderErr : inputBorderOk}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums pointer-events-none">
                      {tituloCupon.length}/{TITULO_CUPON_MAX}
                    </span>
                  </div>
                  <FieldError message={shown('tituloCupon')} />
                </div>

                <div>
                  <label className={labelClass}>Tipo de descuento</label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/50">
                    {([
                      { value: 'porcentaje', label: 'Porcentaje', icon: 'percent' },
                      { value: 'monto_fijo', label: 'Monto fijo', icon: 'attach_money' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={tipoCupon === opt.value}
                        onClick={() => {
                          setTipoCupon(opt.value)
                          if (opt.value === 'porcentaje' && valorCupon && parseInt(valorCupon, 10) > 100) setValorCupon('100')
                        }}
                        className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          tipoCupon === opt.value
                            ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Valor</label>
                    <div className="relative flex items-center">
                      {tipoCupon === 'monto_fijo' && (
                        <span className="absolute left-3 text-sm font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">$</span>
                      )}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(() => {
                          if (!valorCupon) return ''
                          const num = parseInt(valorCupon, 10)
                          if (isNaN(num)) return valorCupon
                          return tipoCupon === 'monto_fijo' ? num.toLocaleString('es-AR') : valorCupon
                        })()}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '')
                          if (!digits) { setValorCupon(''); return }
                          const num = parseInt(digits, 10)
                          setValorCupon(String(tipoCupon === 'porcentaje' ? Math.min(num, 100) : num))
                        }}
                        onBlur={() => touch('valorCupon')}
                        placeholder={tipoCupon === 'porcentaje' ? '15' : '1.500'}
                        className={`${inputBase} ${tipoCupon === 'monto_fijo' ? 'pl-7 pr-3' : 'px-4 pr-9'} ${shown('valorCupon') ? inputBorderErr : inputBorderOk}`}
                      />
                      {tipoCupon === 'porcentaje' && (
                        <span className="absolute right-3 text-sm font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">%</span>
                      )}
                    </div>
                    <FieldError message={shown('valorCupon')} />
                  </div>

                  <div>
                    <label className={labelClass}>Stock (opcional)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stockCupon ? parseInt(stockCupon, 10).toLocaleString('es-AR') : ''}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setStockCupon(digits && parseInt(digits, 10) > 0 ? String(Math.min(parseInt(digits, 10), 100000)) : '')
                      }}
                      placeholder="Sin límite"
                      className={`${inputBase} ${inputBorderOk}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Válido desde</label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <DatePicker
                      value={fechaDesde}
                      onChange={(val) => { setFechaDesde(val); touch('vigencia') }}
                      placeholder="dd/mm/aaaa"
                      size="responsive"
                      hasError={!!shown('vigencia') && !fechaDesde}
                    />
                    <input
                      type="time"
                      value={horaDesde}
                      onChange={(e) => { setHoraDesde(e.target.value); touch('vigencia') }}
                      aria-label="Hora de inicio"
                      className={`${inputBase} w-32 sm:w-28 ${inputBorderOk}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Válido hasta</label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <DatePicker
                      value={fechaHasta}
                      onChange={(val) => { setFechaHasta(val); touch('vigencia') }}
                      placeholder="dd/mm/aaaa"
                      size="responsive"
                      hasError={!!shown('vigencia') && !fechaHasta}
                    />
                    <input
                      type="time"
                      value={horaHasta}
                      onChange={(e) => { setHoraHasta(e.target.value); touch('vigencia') }}
                      aria-label="Hora de fin"
                      className={`${inputBase} w-32 sm:w-28 ${inputBorderOk}`}
                    />
                  </div>
                  <FieldError message={shown('vigencia')} />
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={soloNuevos}
                  onClick={() => setSoloNuevos(v => !v)}
                  className="w-full min-h-[64px] flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-white/10 px-3 py-2.5 text-left active:scale-[0.99] transition-transform"
                >
                  <span className="flex size-11 items-center justify-center rounded-full flex-shrink-0 bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                    <span className="material-symbols-outlined text-[24px]">person_add</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">Solo nuevos registros</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lo ven solo quienes se registren desde el inicio. No se envía push.</span>
                  </span>
                  <span className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${soloNuevos ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${soloNuevos ? 'left-6' : 'left-1'}`} />
                  </span>
                </button>

                <div>
                  <label className={labelClass}>Color del cupón</label>
                  <div className="grid grid-cols-5 gap-2">
                    {couponColorOptions.map(option => {
                      const active = colorCupon === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setColorCupon(option.value)}
                          aria-label={option.label}
                          aria-pressed={active}
                          title={option.label}
                          className={`h-12 rounded-xl border bg-white dark:bg-slate-900 flex items-center justify-center transition-colors active:scale-[0.98] ${active ? `ring-2 ${option.active}` : 'border-slate-200 dark:border-slate-700 hover:border-slate-400/60'}`}
                        >
                          <span className={`size-6 rounded-full ${option.swatch}`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Vista previa</p>
                  <CouponPreview
                    gradient={cuponColor.preview}
                    title={tituloCupon}
                    dateText={cuponFechaTexto}
                    valueText={cuponValorTexto}
                    extraText={cuponExtrasTexto}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Review */}
      {step === 'revisar' && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revisá y enviá</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Chequeá que esté todo bien. Una vez enviada no se puede deshacer.</p>
          </div>

          <div className={`${sectionCard} divide-y divide-slate-100 dark:divide-white/10`}>
            <SummaryRow icon={audience?.icon || 'groups'} label="Para" onEdit={() => setStep('audiencia')}>
              <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{audienceSummary}</p>
            </SummaryRow>
            <SummaryRow icon="chat" label="Mensaje" onEdit={() => setStep('mensaje')}>
              <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{asunto.trim()}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 break-words whitespace-pre-line">{mensaje.trim()}</p>
            </SummaryRow>
            <SummaryRow icon="local_offer" label="Cupón" onEdit={() => setStep('cupon')}>
              {incluirCupon ? (
                <div className="mt-1">
                  <CouponPreview
                    gradient={cuponColor.preview}
                    title={tituloCupon.trim()}
                    dateText={cuponFechaTexto}
                    valueText={cuponValorTexto}
                    extraText={cuponExtrasTexto}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin cupón</p>
              )}
            </SummaryRow>
          </div>

          {sendError && (
            <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-300/60 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              <span className="material-symbols-outlined text-lg">error</span>
              <span className="flex-1 break-words">{sendError}</span>
            </div>
          )}
        </section>
      )}

      {/* Navigation: fixed bottom bar on phones, inline from sm up */}
      <div className="max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-30 max-sm:border-t max-sm:border-slate-200 dark:max-sm:border-slate-700 max-sm:bg-white dark:max-sm:bg-slate-900 max-sm:px-4 max-sm:pt-3 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-2">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={sending}
              aria-label="Volver"
              className={`${secondaryBtn} max-sm:w-12 max-sm:px-0`}
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="max-sm:hidden">Volver</span>
            </button>
          )}
          {onCancel && (
            <button type="button" onClick={handleCancel} disabled={sending} className={`${secondaryBtn} max-sm:px-3`}>
              Cancelar
            </button>
          )}
          {step === 'cupon' && (
            <button type="button" onClick={skipCoupon} className={`${secondaryBtn} max-sm:px-3`}>
              Sin cupón
            </button>
          )}
          {step !== 'revisar' ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!stepValid[step]}
              className={`${primaryBtn} max-sm:min-w-[7.5rem]`}
            >
              Siguiente
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button type="button" onClick={handleSend} disabled={sending} className={`${primaryBtn} max-sm:min-w-[7.5rem]`}>
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  Enviar<span className="max-sm:hidden"> notificación</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      {/* Keeps the last content clear of the fixed bar */}
      <div className={`${step === 'cupon' ? 'h-32' : 'h-20'} sm:hidden`} aria-hidden="true" />
    </div>
  )
}

function CouponPreview({ gradient, title, dateText, valueText, extraText }: { gradient: string; title: string; dateText: string; valueText: string; extraText?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg`}>
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
      <div className="relative flex items-center gap-3">
        <div className="size-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-2xl">confirmation_number</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider opacity-80">Cupón</p>
          <p className="font-bold text-sm truncate">{title || 'Título del cupón'}</p>
          <p className="text-xs opacity-90 mt-0.5">{dateText}</p>
          {extraText && <p className="text-xs opacity-90 mt-0.5">{extraText}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-extrabold text-2xl leading-none tracking-tight">{valueText}</p>
          <p className="text-xs uppercase tracking-wider opacity-80 mt-1">descuento</p>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, onEdit, children }: { icon: string; label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <span className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {children}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-[44px] px-3 -my-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        Editar
      </button>
    </div>
  )
}
