'use client'

import { useState } from 'react'
import NotificationModal from '@/components/ui/NotificationModal'

export default function AdminConfiguracionPage() {
  const [form, setForm] = useState({
    nombreClub: 'Club Deportivo SD',
    email: 'contacto@segurodeportivo.com',
    telefono: '011-4555-1234',
    direccion: 'Av. del Libertador 5000, CABA',
    sitioWeb: 'www.segurodeportivo.com',
  })
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleGuardar = () => {
    setNotification({
      open: true,
      title: 'Configuracion guardada',
      message: 'Los cambios fueron guardados correctamente.',
      type: 'success',
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuracion</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Datos generales del sistema
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Nombre del club</label>
          <input
            type="text"
            value={form.nombreClub}
            onChange={(e) => handleChange('nombreClub', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Email de contacto</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Telefono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => handleChange('telefono', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Sitio web</label>
            <input
              type="text"
              value={form.sitioWeb}
              onChange={(e) => handleChange('sitioWeb', e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Direccion</label>
          <input
            type="text"
            value={form.direccion}
            onChange={(e) => handleChange('direccion', e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGuardar}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Guardar cambios
        </button>
      </div>

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
