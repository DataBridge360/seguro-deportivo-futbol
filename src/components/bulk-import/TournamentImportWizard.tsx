'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import DatePicker from '@/components/ui/DatePicker'
import { tournamentImportPreview, tournamentImportConfirm } from '@/lib/api'
import { generatePassword } from '@/lib/password-generator'
import type { TournamentPreviewResponse, TournamentImportResult } from '@/types/bulk-import'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const CLUB_PLAZA_ID = '62fe34a2-17a0-41d6-a53d-85997094aabf'

interface TournamentImportWizardProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

const STEPS = [
  { label: 'Archivo' },
  { label: 'Torneo' },
  { label: 'Resultado' },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function TournamentImportWizard({ isOpen, onClose, onImportComplete }: TournamentImportWizardProps) {
  const { user } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<TournamentPreviewResponse | null>(null)
  const [result, setResult] = useState<TournamentImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSheet, setSelectedSheet] = useState('')

  // Progress tracking
  const [uploadProgress, setUploadProgress] = useState(0) // 0-100 for file upload
  const [importPhase, setImportPhase] = useState<'idle' | 'uploading' | 'processing' | 'importing'>('idle')
  const [importProgress, setImportProgress] = useState(0) // simulated progress counter
  const importTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tournament form
  const [torneoNombre, setTorneoNombre] = useState('')
  const [torneoFechaInicio, setTorneoFechaInicio] = useState('')
  const [torneoFechaFin, setTorneoFechaFin] = useState('')
  const [torneoInscInicio, setTorneoInscInicio] = useState('')
  const [torneoInscFin, setTorneoInscFin] = useState('')
  const [torneoMaxJugadores, setTorneoMaxJugadores] = useState(25)

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
      setSelectedSheet('')
      setTorneoNombre('')
      setTorneoFechaInicio('')
      setTorneoFechaFin('')
      setTorneoInscInicio('')
      setTorneoInscFin('')
      setTorneoMaxJugadores(25)
      setUploadProgress(0)
      setImportPhase('idle')
      setImportProgress(0)
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current)
        importTimerRef.current = null
      }
    }
  }, [isOpen])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current)
      }
    }
  }, [])

  // Expanded sections for step 2
  const [expandedSection, setExpandedSection] = useState<string | null>('teams')

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
    setSelectedSheet('')
  }

  // Step 1: Upload and preview
  const handleUploadAndPreview = async (sheetOverride?: string) => {
    if (!selectedFile) return
    setLoading(true)
    setImportPhase('uploading')
    setUploadProgress(0)
    try {
      const data = await tournamentImportPreview(
        selectedFile,
        sheetOverride || undefined,
        (progress) => {
          setUploadProgress(progress)
          if (progress >= 100) {
            setImportPhase('processing')
          }
        }
      )
      setPreview(data)
      setSelectedSheet(data.selected_sheet)
    } catch (error) {
      setNotification({ open: true, title: 'Error al procesar', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      setLoading(false)
      setImportPhase('idle')
      setUploadProgress(0)
    }
  }

  // Change sheet
  const handleSheetChange = async (newSheet: string) => {
    if (!selectedFile || newSheet === selectedSheet) return
    setSelectedSheet(newSheet)
    await handleUploadAndPreview(newSheet)
  }

  // Step 1 → Step 2
  const handleGoToStep2 = () => {
    if (preview) setCurrentStep(1)
  }

  // Step 2 → Step 3: Confirm import
  const handleConfirmImport = async () => {
    if (!preview || !user?.id) return
    if (!torneoNombre || !torneoFechaInicio || !torneoFechaFin) {
      setNotification({ open: true, title: 'Datos incompletos', message: 'Completá nombre, fecha de inicio y fecha de fin del torneo', type: 'error' })
      return
    }
    setLoading(true)
    setImportPhase('importing')
    setImportProgress(0)

    // Simulated progress: increment towards total_players over time
    const totalPlayers = preview.total_players
    let currentProgress = 0
    importTimerRef.current = setInterval(() => {
      // Ramp up quickly at first, slow down as we approach 90%
      const remaining = totalPlayers - currentProgress
      const increment = Math.max(1, Math.floor(remaining * 0.08))
      currentProgress = Math.min(currentProgress + increment, Math.floor(totalPlayers * 0.92))
      setImportProgress(currentProgress)
    }, 200)

    try {
      const importResult = await tournamentImportConfirm({
        preview_token: preview.preview_token,
        productor_id: user.id,
        club_id: CLUB_PLAZA_ID,
        torneo: {
          nombre: torneoNombre,
          fecha_inicio: torneoFechaInicio,
          fecha_fin: torneoFechaFin,
          inscripcion_inicio: torneoInscInicio || undefined,
          inscripcion_fin: torneoInscFin || undefined,
          max_jugadores_por_equipo: torneoMaxJugadores,
        },
      })
      // Jump to 100% on success
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current)
        importTimerRef.current = null
      }
      setImportProgress(totalPlayers)
      // Brief delay to show 100% before transitioning
      await new Promise(r => setTimeout(r, 400))
      setResult(importResult)
      setCurrentStep(2)
      onImportComplete()
    } catch (error) {
      setNotification({ open: true, title: 'Error en la importación', message: error instanceof Error ? error.message : 'Error desconocido', type: 'error' })
    } finally {
      if (importTimerRef.current) {
        clearInterval(importTimerRef.current)
        importTimerRef.current = null
      }
      setLoading(false)
      setImportPhase('idle')
      setImportProgress(0)
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

  // Sort teams by category for display
  const teamsByCategory = useMemo(() => {
    if (!preview) return {}
    const grouped: Record<string, typeof preview.teams> = {}
    preview.teams.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = []
      grouped[t.category].push(t)
    })
    return grouped
  }, [preview])

  if (!isOpen) return null

  const canProceedStep1 = preview && preview.total_players > 0
  const canConfirm = torneoNombre && torneoFechaInicio && torneoFechaFin && preview

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={handleAttemptClose}>
        <div
          className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="px-8 pt-8 pb-6 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Carga Masiva de Torneo</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Importar jugadores, equipos y categorías desde Excel</p>
            </div>
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
              <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
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

            {/* ===== STEP 1: File Upload + Sheet Selection ===== */}
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
                  <p className="text-[11px] text-slate-400 mt-1">Formato esperado: APELLIDO Y NOMBRE, DNI, F/NACIMIENTO, CATEGORIA, EQUIPO</p>
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

                {/* Upload button (if no preview yet) */}
                {selectedFile && !preview && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUploadAndPreview()}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {importPhase === 'uploading' ? 'Subiendo archivo...' : 'Procesando archivo...'}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">upload_file</span>
                          Procesar archivo
                        </>
                      )}
                    </button>

                    {/* Upload progress bar */}
                    {loading && (importPhase === 'uploading' || importPhase === 'processing') && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              importPhase === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-primary'
                            }`}
                            style={{ width: `${importPhase === 'processing' ? 100 : uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          {importPhase === 'uploading'
                            ? `Subiendo archivo... ${uploadProgress}%`
                            : 'Analizando jugadores del archivo...'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Sheet selector + Summary */}
                {preview && (
                  <div className="space-y-4">
                    {/* Sheet selector */}
                    {preview.sheet_names.length > 1 && (
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                          Hoja del Excel
                        </label>
                        <select
                          value={selectedSheet}
                          onChange={(e) => handleSheetChange(e.target.value)}
                          disabled={loading}
                          className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        >
                          {preview.sheet_names.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Summary cards */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-blue-400">{preview.categories.length}</span>
                        <span className="text-[9px] uppercase font-bold text-blue-500/70 tracking-widest">Categorías</span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-purple-400">{preview.teams.length}</span>
                        <span className="text-[9px] uppercase font-bold text-purple-500/70 tracking-widest">Equipos</span>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-green-400">{preview.total_players}</span>
                        <span className="text-[9px] uppercase font-bold text-green-500/70 tracking-widest">Jugadores</span>
                      </div>
                      <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
                        <span className="block text-xl font-bold text-red-400">{preview.errors.length}</span>
                        <span className="text-[9px] uppercase font-bold text-red-500/70 tracking-widest">Errores</span>
                      </div>
                    </div>

                    {/* Categories breakdown */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categorías encontradas</p>
                      <div className="flex flex-wrap gap-2">
                        {preview.categories.map(cat => (
                          <span key={cat.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-bold text-blue-500">
                            {cat.name}
                            <span className="text-blue-400/70">{cat.player_count}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* New vs Existing */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-green-500 font-medium">
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        {preview.new_players.length} nuevos
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {preview.existing_players.length} existentes
                      </span>
                    </div>

                    {/* Errors */}
                    {preview.errors.length > 0 && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-500 text-sm font-medium mb-1.5 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">error</span>
                          Errores encontrados
                        </p>
                        <ul className="space-y-1">
                          {preview.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx} className="text-xs text-red-400">
                              Fila {err.row}: {err.message}
                            </li>
                          ))}
                          {preview.errors.length > 5 && (
                            <li className="text-xs text-slate-400">...y {preview.errors.length - 5} más</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: Tournament Data + Detailed Preview ===== */}
            {currentStep === 1 && preview && (
              <div className="space-y-5">
                {/* Tournament form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                      Nombre del torneo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={torneoNombre}
                      onChange={(e) => setTorneoNombre(e.target.value)}
                      placeholder="Ej: Torneo Apertura 2026"
                      className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                        Fecha inicio <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={torneoFechaInicio}
                        onChange={setTorneoFechaInicio}
                        placeholder="Inicio"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                        Fecha fin <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        value={torneoFechaFin}
                        onChange={setTorneoFechaFin}
                        placeholder="Fin"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                        Inscripción inicio
                      </label>
                      <DatePicker
                        value={torneoInscInicio}
                        onChange={setTorneoInscInicio}
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                        Inscripción fin
                      </label>
                      <DatePicker
                        value={torneoInscFin}
                        onChange={setTorneoInscFin}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-1.5">
                      Máx. jugadores por equipo
                    </label>
                    <input
                      type="number"
                      value={torneoMaxJugadores}
                      onChange={(e) => setTorneoMaxJugadores(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                {/* Collapsible sections */}
                <div className="space-y-2">
                  {/* Teams by category */}
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'teams' ? null : 'teams')}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-purple-500">groups</span>
                      Equipos por categoría ({preview.teams.length})
                    </span>
                    <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${expandedSection === 'teams' ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {expandedSection === 'teams' && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                            <tr className="text-left text-slate-500 dark:text-slate-400">
                              <th className="px-3 py-2 font-medium text-xs">Categoría</th>
                              <th className="px-3 py-2 font-medium text-xs">Equipo</th>
                              <th className="px-3 py-2 font-medium text-xs text-right">Jugadores</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(teamsByCategory).map(([cat, teams]) =>
                              teams.map((team, idx) => (
                                <tr key={`${cat}-${team.name}`} className="border-t border-slate-100 dark:border-slate-800">
                                  {idx === 0 ? (
                                    <td className="px-3 py-2 text-xs font-bold text-blue-500" rowSpan={teams.length}>
                                      {cat}
                                    </td>
                                  ) : null}
                                  <td className="px-3 py-2 text-xs text-slate-900 dark:text-white">{team.name}</td>
                                  <td className="px-3 py-2 text-xs text-slate-500 text-right">{team.player_count}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* New players */}
                  {preview.new_players.length > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'new' ? null : 'new')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg text-green-500">person_add</span>
                          Jugadores nuevos ({preview.new_players.length})
                        </span>
                        <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${expandedSection === 'new' ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                      {expandedSection === 'new' && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                <tr className="text-left text-slate-500 dark:text-slate-400">
                                  <th className="px-3 py-2 font-medium text-xs">Nombre</th>
                                  <th className="px-3 py-2 font-medium text-xs">DNI</th>
                                  <th className="px-3 py-2 font-medium text-xs">Equipo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.new_players.slice(0, 50).map((p, idx) => (
                                  <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="px-3 py-1.5 text-xs text-slate-900 dark:text-white">{p.nombre_completo}</td>
                                    <td className="px-3 py-1.5 text-xs font-mono text-slate-500">{p.dni}</td>
                                    <td className="px-3 py-1.5 text-xs text-slate-500">{p.equipo}</td>
                                  </tr>
                                ))}
                                {preview.new_players.length > 50 && (
                                  <tr><td colSpan={3} className="px-3 py-2 text-xs text-slate-400 text-center">...y {preview.new_players.length - 50} más</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Existing players */}
                  {preview.existing_players.length > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'existing' ? null : 'existing')}
                        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg text-slate-500">person</span>
                          Jugadores existentes ({preview.existing_players.length})
                        </span>
                        <span className={`material-symbols-outlined text-lg text-slate-400 transition-transform ${expandedSection === 'existing' ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>
                      {expandedSection === 'existing' && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                <tr className="text-left text-slate-500 dark:text-slate-400">
                                  <th className="px-3 py-2 font-medium text-xs">Nombre</th>
                                  <th className="px-3 py-2 font-medium text-xs">DNI</th>
                                  <th className="px-3 py-2 font-medium text-xs">Equipo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {preview.existing_players.slice(0, 50).map((p, idx) => (
                                  <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="px-3 py-1.5 text-xs text-slate-900 dark:text-white">{p.nombre_completo}</td>
                                    <td className="px-3 py-1.5 text-xs font-mono text-slate-500">{p.dni}</td>
                                    <td className="px-3 py-1.5 text-xs text-slate-500">{p.equipo}</td>
                                  </tr>
                                ))}
                                {preview.existing_players.length > 50 && (
                                  <tr><td colSpan={3} className="px-3 py-2 text-xs text-slate-400 text-center">...y {preview.existing_players.length - 50} más</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ===== STEP 3: Results ===== */}
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
                      {result.success ? 'Torneo importado exitosamente' : 'Importación con errores'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {result.torneo_nombre}
                    </p>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-blue-400">{result.categories_created}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Cat. creadas</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-purple-400">{result.teams_created}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Eq. creados</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-green-400">{result.players_created}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Jug. creados</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 text-center">
                    <span className="block text-xl font-bold text-amber-400">{result.players_assigned}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Asignados</span>
                  </div>
                </div>

                {/* Created players with passwords */}
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
                      Formato: Apellido + últimos 3 dígitos del DNI
                    </p>
                  </div>
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-500 text-sm font-medium mb-1">Errores ({result.errors.length})</p>
                    <ul className="space-y-1">
                      {result.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx} className="text-xs text-red-400">
                          {err.row > 0 ? `Fila ${err.row}` : 'General'} {err.dni ? `(${err.dni})` : ''}: {err.error}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-xs text-slate-400">...y {result.errors.length - 5} más</li>
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
                onClick={handleGoToStep2}
                disabled={!canProceedStep1 || loading}
                className="flex-[1.5] py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Continuar
              </button>
            )}

            {currentStep === 1 && (
              importPhase === 'importing' ? (
                <div className="w-full space-y-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-200"
                      style={{ width: `${preview ? (importProgress / preview.total_players) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center font-medium">
                    {importProgress}/{preview?.total_players ?? 0} jugadores cargados
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={loading || !canConfirm}
                    className="flex-[1.5] py-2.5 px-4 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-40 text-white dark:text-slate-900 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
                  >
                    <span className="material-symbols-outlined text-lg">check</span>
                    Crear Torneo e Importar
                  </button>
                </>
              )
            )}

            {currentStep === 2 && (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                Cerrar
              </button>
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
              Salir de la carga de torneo
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-5">
              Si salís ahora, vas a perder todo el progreso. ¿Estás seguro?
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
