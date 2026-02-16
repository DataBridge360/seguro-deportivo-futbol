'use client'

import { Upload } from 'lucide-react'

interface FileUploadSectionProps {
  onFileSelect: (file: File) => void
  onUpload: () => void
  selectedFile: File | null
  isLoading: boolean
}

export default function FileUploadSection({
  onFileSelect,
  onUpload,
  selectedFile,
  isLoading
}: FileUploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Seleccionar archivo Excel
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Sube un archivo .xls o .xlsx con los datos de los jugadores (máximo 10 MB)
        </p>
      </div>

      {/* File Input */}
      <div>
        <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-2">
          Archivo
        </label>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          disabled={isLoading}
          className="block w-full text-sm text-slate-500 dark:text-slate-400
            file:mr-4 file:py-2.5 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-primary file:text-white
            hover:file:bg-primary/90
            file:cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            onClick={() => onFileSelect(null as any)}
            disabled={isLoading}
            className="text-slate-400 hover:text-red-500 text-sm font-medium disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={onUpload}
          disabled={!selectedFile || isLoading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          {isLoading ? 'Procesando...' : 'Procesar archivo'}
        </button>
      </div>
    </div>
  )
}
