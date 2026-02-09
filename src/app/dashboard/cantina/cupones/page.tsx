'use client'

import { useState } from 'react'
import { MOCK_CUPONES } from '@/lib/mockData'
import type { Cupon } from '@/lib/mockData'
import NotificationModal from '@/components/ui/NotificationModal'

export default function CantinaCuponesPage() {
  const [codigo, setCodigo] = useState('')
  const [cuponEncontrado, setCuponEncontrado] = useState<Cupon | null>(null)
  const [montoCompra, setMontoCompra] = useState('')
  const [step, setStep] = useState<'buscar' | 'preview' | 'monto' | 'confirmar'>('buscar')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ open: false, title: '', message: '', type: 'info' })

  const handleBuscar = () => {
    setError('')
    const cupon = MOCK_CUPONES.find(c => c.codigo.toLowerCase() === codigo.trim().toLowerCase())

    if (!cupon) {
      setError('Cupon no encontrado. Verifica el codigo.')
      return
    }

    if (cupon.estado === 'usado') {
      setError('Este cupon ya fue utilizado.')
      return
    }

    if (cupon.estado === 'vencido') {
      setError('Este cupon esta vencido.')
      return
    }

    setCuponEncontrado(cupon)
    setStep('preview')
  }

  const calcularDescuento = (): number => {
    if (!cuponEncontrado || !montoCompra) return 0
    const monto = parseFloat(montoCompra)
    if (cuponEncontrado.tipo === 'porcentaje') {
      return Math.round(monto * cuponEncontrado.valor / 100)
    }
    return Math.min(cuponEncontrado.valor, monto)
  }

  const handleConfirmarCanje = () => {
    setNotification({
      open: true,
      title: 'Cupon canjeado',
      message: `Descuento de $${calcularDescuento().toLocaleString()} aplicado correctamente. Total a cobrar: $${(parseFloat(montoCompra) - calcularDescuento()).toLocaleString()}`,
      type: 'success',
    })
    // Reset
    setCodigo('')
    setCuponEncontrado(null)
    setMontoCompra('')
    setStep('buscar')
  }

  const handleReset = () => {
    setCodigo('')
    setCuponEncontrado(null)
    setMontoCompra('')
    setStep('buscar')
    setError('')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Validar Cupon</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ingresa el codigo del cupon para verificarlo y aplicar el descuento
        </p>
      </div>

      {/* Step 1: Buscar */}
      {step === 'buscar' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
          <div className="text-center mb-2">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-primary text-3xl">qr_code_scanner</span>
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white">Ingresar codigo</h2>
          </div>

          <div>
            <input
              type="text"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setError('') }}
              placeholder="Ej: CUP-2026-A1B2"
              className={`w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary text-center tracking-wider ${
                error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
            />
            {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
          </div>

          <button
            onClick={handleBuscar}
            disabled={!codigo.trim()}
            className="w-full px-5 py-3 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Verificar cupon
          </button>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && cuponEncontrado && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <div className="size-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-green-500 text-3xl">check_circle</span>
            </div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Cupon valido</h2>
            <p className="font-mono text-sm text-slate-500 dark:text-slate-400">{cuponEncontrado.codigo}</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Descripcion</span>
              <span className="font-medium text-slate-900 dark:text-white">{cuponEncontrado.descripcion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Descuento</span>
              <span className="font-bold text-green-500">
                {cuponEncontrado.tipo === 'porcentaje' ? `${cuponEncontrado.valor}%` : `$${cuponEncontrado.valor}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Vencimiento</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {new Date(cuponEncontrado.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleReset} className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
              Cancelar
            </button>
            <button onClick={() => setStep('monto')} className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
              Aplicar descuento
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Monto */}
      {step === 'monto' && cuponEncontrado && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white">Monto de la compra</h2>

          <div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                value={montoCompra}
                onChange={(e) => setMontoCompra(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 pl-8 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-lg font-bold focus:outline-none focus:border-primary"
                min="0"
              />
            </div>
          </div>

          {montoCompra && parseFloat(montoCompra) > 0 && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-medium text-slate-900 dark:text-white">${parseFloat(montoCompra).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Descuento ({cuponEncontrado.tipo === 'porcentaje' ? `${cuponEncontrado.valor}%` : `$${cuponEncontrado.valor}`})</span>
                <span className="font-medium text-green-600 dark:text-green-400">-${calcularDescuento().toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-500/20">
                <span className="font-bold text-slate-900 dark:text-white">Total a cobrar</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">${(parseFloat(montoCompra) - calcularDescuento()).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('preview')} className="flex-1 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
              Volver
            </button>
            <button
              onClick={handleConfirmarCanje}
              disabled={!montoCompra || parseFloat(montoCompra) <= 0}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Confirmar canje
            </button>
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
