'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import { bulkImportPreview, bulkImportConfirm } from '@/lib/api'
import { generatePassword } from '@/lib/password-generator'
import type { PreviewResponse, ImportResult } from '@/types/bulk-import'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const CLUB_PLAZA_ID = '62fe34a2-17a0-41d6-a53d-85997094aabf'

interface BulkImportWizardProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

const STEPS = [
  { label: 'Subir' },
  { label: 'Revisar' },
  { label: 'Importar' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

interface ConflictItem {
  id: string
  nombre: string
  description: string
  oldValue: string
  newValue: string
}

export default function BulkImportWizard({ isOpen, onClose, onImportComplete }: BulkImportWizardProps) {
  const { user } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [acceptedConflicts, setAcceptedConflicts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const [notification, setNotification] = useState<{
    open: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({ open: false, title: '', message: '', type: 'info' })

  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0)
      setSelectedFile(null)
      setPreview(null)
      setResult(null)
      setAcceptedConflicts(new Set())
    }
  }, [isOpen])

  // Initialize accepted conflicts when preview loads (all checked by default)
  useEffect(() => {
    if (preview) {
      const ids = new Set<string>()
      preview.dni_conflicts?.forEach(c => ids.add(c.existing_id))
      preview.birth_date_conflicts?.forEach(c => ids.add(c.existing_id))
      preview.name_conflicts?.forEach(c => ids.add(c.existing_id))
      setAcceptedConflicts(ids)
    }
  }, [preview])

  // Build unified conflict list for display
  const allConflicts: ConflictItem[] = useMemo(() => {
    if (!preview) return []
    return [
      ...(preview.dni_conflicts || []).map(c => ({
        id: c.existing_id,
        nombre: c.nombre_nuevo,
        description: 'El nombre en el archivo no coincide con el registrado.',
        oldValue: c.nombre_existente,
        newValue: c.nombre_nuevo,
      })),
      ...(preview.birth_date_conflicts || []).map(c => ({
        id: c.existing_id,
        nombre: c.nombre_completo,
        description: 'Diferencia en la fecha de nacimiento.',
        oldValue: c.fecha_nacimiento_existente,
        newValue: c.fecha_nacimiento_nueva,
      })),
      ...(preview.name_conflicts || []).map(c => ({
        id: c.existing_id,
        nombre: c.nombre_completo,
        description: 'El DNI en el archivo no coincide con el registrado.',
        oldValue: c.dni_existente,
        newValue: c.dni_nuevo,
      })),
    ]
  }, [preview])

  const toggleConflict = (id: string) => {
    setAcceptedConflicts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      return
    }
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!['.xls', '.xlsx'].includes(ext)) {
      setNotification({ open: true, title: 'Archivo inválido', message: 'Solo se aceptan archivos .xls o .xlsx', type: 'error' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setNotification({ open: true, title: 'Archivo muy grande', message: 'El archivo no puede superar los 10 MB', type: 'error' })
      return
    }
    setSelectedFile(file)
    setPreview(null)
    setResult(null)
  }

  // Step 1 → Step 2
  const handleUploadAndPreview = async () => {
    if (!selectedFile) return
    setLoading(true)
    try {
      const data = await bulkImportPreview(selectedFile)
      setPreview(data)
      setCurrentStep(1)
    } catch (error) {
      setNotification({ open: true, title: 'Error al procesar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → Step 3
  const handleConfirmImport = async () => {
    if (!preview || !user?.id) return
    setLoading(true)
    try {
      const importResult = await bulkImportConfirm({
        preview_token: preview.preview_token,
        productor_id: user.id,
        club_id: CLUB_PLAZA_ID,
        overwrite_existing: true,
        accepted_conflict_ids: Array.from(acceptedConflicts),
        test_mode: false
      })
      setResult(importResult)
      setCurrentStep(2)
      onImportComplete()
    } catch (error) {
      setNotification({ open: true, title: 'Error en la importación', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const hasProgress = selectedFile !== null || currentStep > 0
  const handleAttemptClose = () => {
    if (currentStep === 2 || !hasProgress) {
      onClose()
    } else {
      setShowExitConfirm(true)
    }
  }

  if (!isOpen) return null

  const canImport = preview && (preview.new_players.length > 0 || acceptedConflicts.size > 0)

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleAttemptClose}>
        <div
          className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="px-8 pt-8 pb-6 flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Carga Masiva</h2>
            <button
              onClick={handleAttemptClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </header>

          {/* Stepper */}
          <nav className="px-8 mb-8 shrink-0">
            <div className="flex items-center justify-between relative max-w-xs mx-auto">
              {/* Line background */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
              {/* Line progress */}
              <div className={`absolute top-4 left-0 h-0.5 bg-green-500 z-0 transition-all duration-300 ${
                currentStep === 0 ? 'w-0' : currentStep === 1 ? 'w-1/2' : 'w-full'
              }`} />
              {STEPS.map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white dark:ring-[#111827] transition-colors ${
                    idx < currentStep
                      ? 'bg-green-500 text-white'
                      : idx === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {idx < currentStep ? (
                      <span className="material-symbols-outlined text-lg">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    idx < currentStep ? 'text-green-500'
                    : idx === currentStep ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <main className="px-8 pb-8 overflow-y-auto flex-1 min-h-0">

            {/* ===== STEP 1: Club + Archivo ===== */}
            {currentStep === 0 && (
              <div className="space-y-4">
                {/* File input */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                    Archivo Excel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
                    disabled={loading}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400
                      file:mr-3 file:py-2 file:px-3
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-white
                      hover:file:bg-primary/90
                      file:cursor-pointer
                      disabled:opacity-50"
                  />
                </div>

                {/* Selected file info */}
                {selectedFile && (
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                    <span className="material-symbols-outlined text-primary text-lg">description</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button onClick={() => handleFileSelect(null)} className="text-slate-400 hover:text-red-500 text-xs font-medium">Quitar</button>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: Preview + Confirm ===== */}
            {currentStep === 1 && preview && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-green-400">{preview.new_players.length}</span>
                    <span className="text-[9px] uppercase font-bold text-green-500/70 tracking-widest">Nuevos</span>
                  </div>
                  <div className={`bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-xl p-3 text-center ${allConflicts.length > 0 ? 'ring-1 ring-orange-500/30' : ''}`}>
                    <span className="block text-xl font-bold text-orange-400">{allConflicts.length}</span>
                    <span className="text-[9px] uppercase font-bold text-orange-500/70 tracking-widest">Diferencias</span>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-red-400">{preview.errors.length}</span>
                    <span className="text-[9px] uppercase font-bold text-red-500/70 tracking-widest">Errores</span>
                  </div>
                </div>

                {/* Errors */}
                {preview.errors.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-500 text-sm font-medium mb-1.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">error</span>
                      Errores encontrados
                    </p>
                    <ul className="space-y-1">
                      {preview.errors.slice(0, 3).map((err, idx) => (
                        <li key={idx} className="text-xs text-red-400">
                          Fila {err.row}: {err.message}
                        </li>
                      ))}
                      {preview.errors.length > 3 && (
                        <li className="text-xs text-slate-400">...y {preview.errors.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Conflict cards */}
                {allConflicts.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="flex items-center gap-2 text-orange-500 dark:text-orange-400/90 font-semibold text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined text-base">warning</span>
                      Conflictos detectados
                    </h3>
                    <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4">
                      {allConflicts.map((conflict) => (
                        <div key={conflict.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
                          {/* Player info */}
                          <div className="p-4 bg-slate-100/50 dark:bg-slate-800/20">
                            <p className="text-slate-900 dark:text-white font-bold text-sm tracking-tight">{conflict.nombre}</p>
                            <p className="text-slate-500 text-[11px] mt-0.5">{conflict.description}</p>
                          </div>
                          {/* Comparison: old vs new */}
                          <div className="px-4 py-3 grid grid-cols-2 gap-0 border-y border-slate-200 dark:border-slate-700/50 bg-white dark:bg-black/10">
                            <div className="pr-4 border-r border-slate-200 dark:border-slate-700/50">
                              <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">En Sistema</p>
                              <p className="text-orange-500 dark:text-orange-400 font-mono text-sm">{conflict.oldValue}</p>
                            </div>
                            <div className="pl-4">
                              <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1 text-right">Nuevo Valor</p>
                              <p className="text-green-600 dark:text-green-400 font-mono text-sm text-right">{conflict.newValue}</p>
                            </div>
                          </div>
                          {/* Checkbox */}
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={acceptedConflicts.has(conflict.id)}
                                onChange={() => toggleConflict(conflict.id)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-500 focus:ring-blue-500/50 transition-all"
                              />
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                Aceptar cambio y sobreescribir
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Sin cambios note */}
                {preview.existing_players.length > 0 && (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined text-lg">info</span>
                    <span className="text-xs">{preview.existing_players.length} jugador{preview.existing_players.length !== 1 ? 'es' : ''} sin cambios (datos idénticos)</span>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 3: Resultados ===== */}
            {currentStep === 2 && result && (
              <div className="space-y-4">
                {/* Success/error banner */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  result.success
                    ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20'
                    : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20'
                }`}>
                  <span className={`material-symbols-outlined text-xl ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                    {result.success ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                      {result.success ? 'Importación exitosa' : 'Importación con errores'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {result.inserted} creados · {result.updated} actualizados · {result.skipped} omitidos
                    </p>
                  </div>
                </div>

                {/* Created players table */}
                {result.created_players && result.created_players.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                      Jugadores creados y contraseñas:
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="overflow-x-auto max-h-52">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                            <tr className="text-left text-slate-500 dark:text-slate-400">
                              <th className="px-3 py-2 font-medium text-xs">Nombre</th>
                              <th className="px-3 py-2 font-medium text-xs">DNI</th>
                              <th className="px-3 py-2 font-medium text-xs">Contraseña</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.created_players.map((player, idx) => (
                              <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                                <td className="px-3 py-2 text-slate-900 dark:text-white text-xs">{player.nombre_completo}</td>
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300 text-xs">{player.dni}</td>
                                <td className="px-3 py-2">
                                  <code className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded font-mono font-bold text-xs">
                                    {generatePassword(player.apellido, player.dni)}
                                  </code>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Formato: Apellido + últimos 3 dígitos del DNI. Ej: Abarzua875
                    </p>
                  </div>
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-500 text-sm font-medium mb-1">Errores ({result.errors.length})</p>
                    <ul className="space-y-1">
                      {result.errors.slice(0, 3).map((err, idx) => (
                        <li key={idx} className="text-xs text-red-400">Fila {err.row} ({err.dni}): {err.error}</li>
                      ))}
                      {result.errors.length > 3 && (
                        <li className="text-xs text-slate-400">...y {result.errors.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Footer buttons */}
          <footer className="px-8 py-5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex gap-4 shrink-0">
            {currentStep === 0 && (
              <button
                onClick={handleUploadAndPreview}
                disabled={!selectedFile || loading}
                className="flex-[1.5] py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    Procesar archivo
                  </>
                )}
              </button>
            )}

            {currentStep === 1 && (
              <>
                <button
                  onClick={() => { setCurrentStep(0); setPreview(null) }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Volver
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={loading || !canImport}
                  className="flex-[1.5] py-2.5 px-4 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white dark:text-slate-900 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    'Continuar Importación'
                  )}
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <button
                  onClick={() => {
                    setCurrentStep(0)
                    setSelectedFile(null)
                    setPreview(null)
                    setResult(null)
                    setAcceptedConflicts(new Set())
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Nueva carga
                </button>
                <button
                  onClick={onClose}
                  className="flex-[1.5] py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  Cerrar
                </button>
              </>
            )}
          </footer>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4">
              <div className="bg-amber-500/10 p-3 rounded-full">
                <span className="material-symbols-outlined text-2xl text-amber-500">warning</span>
              </div>
            </div>
            <h3 className="text-slate-900 dark:text-white text-lg font-bold text-center mb-2">
              Salir de la carga masiva
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              Si salís ahora, vas a perder todo el progreso de la importación. ¿Estás seguro?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Continuar
              </button>
              <button
                onClick={() => { setShowExitConfirm(false); onClose() }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </>
  )
}
