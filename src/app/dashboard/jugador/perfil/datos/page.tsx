'use client'

import { useState, useEffect, useCallback } from 'react'
import { getJugadorPerfil, updateJugadorPerfil } from '@/lib/api'
import type { JugadorResponse } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

const WHATSAPP_NUMBER = '542996130664'

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDNI(dni: string) {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default function DatosPersonalesPage() {
  const [perfil, setPerfil] = useState<JugadorResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'personales' | 'contacto'>('personales')
  const [editing, setEditing] = useState(false)

  // Campos editables
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Modal de descartar cambios
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success',
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await getJugadorPerfil()
        setPerfil(data)
        setTelefono(data.telefono || '')
        setEmail(data.email || '')
        setDireccion(data.direccion || '')
      } catch (error) {
        console.error('Error al cargar perfil:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!perfil) return
    const changed =
      telefono !== (perfil.telefono || '') ||
      email !== (perfil.email || '') ||
      direccion !== (perfil.direccion || '')
    setHasChanges(changed)
  }, [telefono, email, direccion, perfil])

  // Proteger navegacion del navegador (refresh, cerrar pestaña)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editing && hasChanges) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editing, hasChanges])

  const resetFields = useCallback(() => {
    if (!perfil) return
    setTelefono(perfil.telefono || '')
    setEmail(perfil.email || '')
    setDireccion(perfil.direccion || '')
    setErrors({})
    setHasChanges(false)
  }, [perfil])

  const tryAction = (action: () => void) => {
    if (editing && hasChanges) {
      setPendingAction(() => action)
      setShowDiscardModal(true)
    } else {
      action()
    }
  }

  const handleDiscardConfirm = () => {
    resetFields()
    setEditing(false)
    setShowDiscardModal(false)
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
  }

  const handleDiscardCancel = () => {
    setShowDiscardModal(false)
    setPendingAction(null)
  }

  const handleTabChange = (newTab: 'personales' | 'contacto') => {
    if (newTab === tab) return
    tryAction(() => setTab(newTab))
  }

  const handleStartEditing = () => {
    setEditing(true)
  }

  const handleCancelEditing = () => {
    if (hasChanges) {
      setPendingAction(() => () => {
        resetFields()
        setEditing(false)
      })
      setShowDiscardModal(true)
    } else {
      setEditing(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Telefono: solo digitos y opcionalmente + al inicio
    if (telefono && !/^\+?\d+$/.test(telefono)) {
      newErrors.telefono = 'Solo numeros y opcionalmente + al inicio'
    }

    // Email: formato basico
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un correo valido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardar = async () => {
    if (!validate()) return

    try {
      setSaving(true)
      const updated = await updateJugadorPerfil({ telefono, email, direccion })
      setPerfil(updated)
      setHasChanges(false)
      setEditing(false)
      setNotification({
        open: true,
        title: 'Datos actualizados',
        message: 'Tus datos fueron guardados correctamente',
        type: 'success',
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al guardar',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSolicitarCorreccion = () => {
    const mensaje = encodeURIComponent(
      `Hola, soy ${perfil?.nombre_completo || 'jugador'} (DNI: ${perfil?.dni || '-'}). Necesito solicitar una corrección en mis datos personales.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (!perfil) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">error</span>
        <p className="text-slate-500 dark:text-slate-400">No se pudieron cargar los datos</p>
      </div>
    )
  }

  const vigente = perfil.pagado

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Mis datos</h1>
        <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
          Consulta y actualiza tu informacion
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => handleTabChange('personales')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'personales'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">person</span>
          Datos personales
        </button>
        <button
          onClick={() => handleTabChange('contacto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
            tab === 'contacto'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">contact_phone</span>
          Datos de contacto
        </button>
      </div>

      {/* Tab: Datos personales (read-only) */}
      {tab === 'personales' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Nombre completo</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 truncate">{perfil.nombre_completo}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">badge</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">DNI</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{formatDNI(perfil.dni)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">cake</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Fecha de nacimiento</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{formatDate(perfil.fecha_nacimiento)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Estado del seguro</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{vigente ? 'Pagado' : 'No pagado'}</p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${
                vigente
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {vigente ? 'Pagado' : 'No pagado'}
              </span>
            </div>
          </div>

          {/* Info + solicitar correccion */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">info</span>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Estos datos solo pueden ser modificados por un administrador. Si encontras un error, solicita una correccion.
              </p>
            </div>
          </div>

          <button
            onClick={handleSolicitarCorreccion}
            className="w-full flex items-center justify-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            Solicitar correccion de datos
          </button>
        </div>
      )}

      {/* Tab: Datos de contacto */}
      {tab === 'contacto' && (
        <div className="space-y-6">
          {/* Modo lectura */}
          {!editing && (
            <>
              <div className="flex flex-col gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">phone</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Telefono</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{perfil.telefono || <span className="text-slate-400 dark:text-slate-500 italic">Sin registrar</span>}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">mail</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Correo electronico</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{perfil.email || <span className="text-slate-400 dark:text-slate-500 italic">Sin registrar</span>}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider">Direccion</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{perfil.direccion || <span className="text-slate-400 dark:text-slate-500 italic">Sin registrar</span>}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartEditing}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors active:scale-[0.98] bg-primary hover:bg-primary/90 text-white"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                Editar datos de contacto
              </button>
            </>
          )}

          {/* Modo edicion */}
          {editing && (
            <>
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-lg">edit_note</span>
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    Modo edicion activo
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Telefono */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-primary/30 dark:border-primary/20 p-4">
                  <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
                    Telefono
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">phone</span>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '')
                        setTelefono(val)
                        if (errors.telefono) setErrors(prev => ({ ...prev, telefono: '' }))
                      }}
                      placeholder="Ej: +542996130664"
                      className={`flex-1 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                        errors.telefono ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.telefono && <p className="text-red-400 text-xs mt-2 ml-10">{errors.telefono}</p>}
                </div>

                {/* Email */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-primary/30 dark:border-primary/20 p-4">
                  <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
                    Correo electronico
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">mail</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                      }}
                      placeholder="Ej: tu@email.com"
                      className={`flex-1 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
                        errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-2 ml-10">{errors.email}</p>}
                </div>

                {/* Direccion */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-primary/30 dark:border-primary/20 p-4">
                  <label className="text-[11px] text-[#617989] dark:text-slate-400 uppercase font-bold tracking-wider block mb-2">
                    Direccion
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Ej: Av. San Martin 123"
                      className="flex-1 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Botones guardar / cancelar */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelEditing}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors active:scale-[0.98] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving || !hasChanges}
                  className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors active:scale-[0.98] ${
                    hasChanges
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal descartar cambios */}
      {showDiscardModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleDiscardCancel}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-500 text-2xl">warning</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              Cambios sin guardar
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Tenes cambios que no se guardaron. Si salis ahora, se perderan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardCancel}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-colors"
              >
                Seguir editando
              </button>
              <button
                onClick={handleDiscardConfirm}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Descartar
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
