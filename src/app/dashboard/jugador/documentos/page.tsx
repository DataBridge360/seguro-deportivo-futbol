'use client'

import { useState } from 'react'
import { MOCK_DOCUMENTOS_JUGADOR } from '@/lib/mockData'
import type { DocumentoJugador } from '@/lib/mockData'
import NotificationModal from '@/components/ui/NotificationModal'

const tipoLabels: Record<DocumentoJugador['tipo'], string> = {
  dni: 'DNI',
  ficha_medica: 'Ficha Medica',
  contrato: 'Contrato',
  otro: 'Otro',
}

const tipoIcons: Record<DocumentoJugador['tipo'], string> = {
  dni: 'badge',
  ficha_medica: 'medical_information',
  contrato: 'description',
  otro: 'attach_file',
}

function getEstadoBadge(estado: DocumentoJugador['estado']) {
  switch (estado) {
    case 'aprobado':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
    case 'pendiente':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    case 'rechazado':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
  }
}

function getEstadoLabel(estado: DocumentoJugador['estado']) {
  switch (estado) {
    case 'aprobado': return 'Aprobado'
    case 'pendiente': return 'Pendiente'
    case 'rechazado': return 'Rechazado'
  }
}

export default function JugadorDocumentosPage() {
  const [documentos, setDocumentos] = useState(MOCK_DOCUMENTOS_JUGADOR.filter(d => d.jugadorId === '1'))
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTipo, setUploadTipo] = useState<DocumentoJugador['tipo']>('dni')
  const [uploadNombre, setUploadNombre] = useState('')
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const handleUpload = () => {
    if (!uploadNombre.trim()) return

    const nuevo: DocumentoJugador = {
      id: String(Date.now()),
      nombre: uploadNombre.trim(),
      tipo: uploadTipo,
      estado: 'pendiente',
      fechaSubida: new Date().toISOString().split('T')[0],
      jugadorId: '1',
    }
    setDocumentos(prev => [...prev, nuevo])
    setShowUploadModal(false)
    setUploadNombre('')
    setUploadTipo('dni')
    setNotification({
      open: true,
      title: 'Documento subido',
      message: 'El documento fue subido correctamente y esta pendiente de revision.',
      type: 'success',
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111518] dark:text-white">Documentos</h1>
          <p className="text-sm text-[#617989] dark:text-slate-400 mt-1">
            Gestion de documentos personales
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">upload_file</span>
          Subir
        </button>
      </div>

      {/* Lista de documentos */}
      <div className="flex flex-col gap-3">
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4"
          >
            <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-xl">{tipoIcons[doc.tipo]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{doc.nombre}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">{tipoLabels[doc.tipo]}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(doc.fechaSubida + 'T00:00:00').toLocaleDateString('es-AR')}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ${getEstadoBadge(doc.estado)}`}>
              {getEstadoLabel(doc.estado)}
            </span>
          </div>
        ))}

        {documentos.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3 block">folder_open</span>
            <p className="text-slate-500 dark:text-slate-400">No tenes documentos cargados</p>
          </div>
        )}
      </div>

      {/* Modal subir documento */}
      {showUploadModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Subir documento</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Tipo de documento</label>
                <select
                  value={uploadTipo}
                  onChange={(e) => setUploadTipo(e.target.value as DocumentoJugador['tipo'])}
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="dni">DNI</option>
                  <option value="ficha_medica">Ficha Medica</option>
                  <option value="contrato">Contrato</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Nombre del documento</label>
                <input
                  type="text"
                  value={uploadNombre}
                  onChange={(e) => setUploadNombre(e.target.value)}
                  placeholder="Ej: DNI Frente"
                  className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Mock file input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-400 dark:text-slate-500 mb-2 block">cloud_upload</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Archivo seleccionado (mock)</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadNombre.trim()}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Subir
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
