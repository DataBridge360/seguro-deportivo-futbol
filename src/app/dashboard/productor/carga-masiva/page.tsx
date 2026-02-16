'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import NotificationModal from '@/components/ui/NotificationModal'
import FileUploadSection from '@/components/bulk-import/FileUploadSection'
import PreviewSection from '@/components/bulk-import/PreviewSection'
import ResultsSection from '@/components/bulk-import/ResultsSection'
import { bulkImportPreview, bulkImportConfirm, getClubs } from '@/lib/api'
import type { PreviewResponse, ImportResult, Club } from '@/types/bulk-import'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export default function CargaMasivaPage() {
  const { user } = useAuthStore()

  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(true)

  const [notification, setNotification] = useState<{
    open: boolean
    title: string
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  })

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    onConfirm: () => void
  }>({
    open: false,
    onConfirm: () => {}
  })

  // Load clubs on mount
  useEffect(() => {
    async function loadClubs() {
      try {
        setLoadingClubs(true)
        const clubsList = await getClubs()
        setClubs(clubsList)
      } catch (error) {
        console.error('Error al cargar clubes:', error)
        setNotification({
          open: true,
          title: 'Error al cargar clubes',
          message: 'No se pudo obtener la lista de clubes. Verifica que el endpoint /api/v1/clubes esté disponible en el backend.',
          type: 'error'
        })
        setClubs([])
      } finally {
        setLoadingClubs(false)
      }
    }
    loadClubs()
  }, [])

  // Handler: File Selection with Validation
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null)
      return
    }

    // Validate file type
    const validExtensions = ['.xls', '.xlsx']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validExtensions.includes(fileExtension)) {
      setNotification({
        open: true,
        title: 'Archivo inválido',
        message: 'Por favor selecciona un archivo Excel (.xls o .xlsx)',
        type: 'error'
      })
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setNotification({
        open: true,
        title: 'Archivo muy grande',
        message: 'El archivo no puede superar los 10 MB',
        type: 'error'
      })
      return
    }

    setSelectedFile(file)
    setPreview(null)
    setResult(null)
  }

  // Handler: Upload File and Get Preview
  const handleUpload = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const previewData = await bulkImportPreview(selectedFile)
      setPreview(previewData)
      setNotification({
        open: true,
        title: 'Archivo procesado',
        message: `Se encontraron ${previewData.total} jugadores en el archivo`,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error al procesar archivo',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler: Test Import (1 player)
  const handleTestImport = async () => {
    if (!preview || !user?.id) return

    if (!selectedClubId) {
      setNotification({
        open: true,
        title: 'Club no seleccionado',
        message: 'Debes seleccionar un club antes de importar jugadores',
        type: 'warning'
      })
      return
    }

    setLoading(true)
    try {
      const importResult = await bulkImportConfirm({
        preview_token: preview.preview_token,
        productor_id: user.id,
        club_id: selectedClubId,
        overwrite_existing: overwriteExisting,
        test_mode: true
      })

      console.log('📊 Resultado de importación:', importResult)
      setResult(importResult)
      setNotification({
        open: true,
        title: 'Prueba completada',
        message: importResult.message,
        type: 'success'
      })
    } catch (error) {
      setNotification({
        open: true,
        title: 'Error en la prueba',
        message: error instanceof Error ? error.message : 'Error desconocido',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler: Full Import (all players)
  const handleFullImport = () => {
    if (!preview) return

    if (!selectedClubId) {
      setNotification({
        open: true,
        title: 'Club no seleccionado',
        message: 'Debes seleccionar un club antes de importar jugadores',
        type: 'warning'
      })
      return
    }

    // Show custom confirmation modal
    setConfirmModal({
      open: true,
      onConfirm: async () => {
        setConfirmModal({ open: false, onConfirm: () => {} })

        if (!user?.id) return

        setLoading(true)
        try {
          const importResult = await bulkImportConfirm({
            preview_token: preview.preview_token,
            productor_id: user.id,
            club_id: selectedClubId,
            overwrite_existing: overwriteExisting,
            test_mode: false
          })

          console.log('📊 Resultado de importación completa:', importResult)
          setResult(importResult)
          setPreview(null)
          setNotification({
            open: true,
            title: 'Importación completada',
            message: importResult.message,
            type: importResult.success ? 'success' : 'error'
          })
        } catch (error) {
          setNotification({
            open: true,
            title: 'Error en la importación',
            message: error instanceof Error ? error.message : 'Error desconocido',
            type: 'error'
          })
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // Handler: Reset to Initial State
  const handleReset = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setOverwriteExisting(false)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Carga Masiva de Jugadores</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Importa múltiples jugadores desde un archivo Excel
        </p>
      </div>

      {/* Club Selector - REQUIRED */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-2">
              Seleccionar Club <span className="text-red-500">*</span>
            </label>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
              Los jugadores se asignarán al club seleccionado
            </p>
            {loadingClubs ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Cargando clubes...
              </div>
            ) : clubs.length === 0 ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">
                  ⚠️ No se pudieron cargar los clubes
                </p>
                <p className="text-red-500 dark:text-red-300 text-xs">
                  Verifica que el endpoint <code className="bg-red-100 dark:bg-red-900 px-1 rounded">/api/v1/clubes</code> esté disponible en el backend.
                </p>
              </div>
            ) : (
              <select
                value={selectedClubId}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
              >
                <option value="">-- Selecciona un club --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.nombre}
                  </option>
                ))}
              </select>
            )}
            {!selectedClubId && !loadingClubs && (
              <p className="text-amber-500 text-xs mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Selecciona un club para habilitar la importación
              </p>
            )}
            {selectedClubId && (
              <p className="text-green-500 text-xs mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Club seleccionado: {clubs.find(c => c.id === selectedClubId)?.nombre}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Rendering based on Workflow Stage */}

      {/* Stage 1: File Upload */}
      {!preview && !result && (
        <FileUploadSection
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
          selectedFile={selectedFile}
          isLoading={loading}
        />
      )}

      {/* Stage 2: Preview */}
      {preview && !result && (
        <PreviewSection
          preview={preview}
          overwriteExisting={overwriteExisting}
          onOverwriteChange={setOverwriteExisting}
          onTestImport={handleTestImport}
          onFullImport={handleFullImport}
          isLoading={loading}
        />
      )}

      {/* Stage 3: Results */}
      {result && (
        <ResultsSection
          result={result}
          onNewImport={handleReset}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />

      {/* Confirmation Modal for Full Import */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              Confirmar Importación
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              ¿Estás seguro de importar <strong>{preview?.total || 0} jugadores</strong> al club{' '}
              <strong className="text-primary">
                {clubs.find(c => c.id === selectedClubId)?.nombre}
              </strong>?
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ open: false, onConfirm: () => {} })}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
