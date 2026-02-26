'use client'

import { useState } from 'react'
import { buscarCupon, canjearCupon, CuponResponse } from '@/lib/api'
import NotificationModal from '@/components/ui/NotificationModal'

type Step = 'buscar' | 'preview' | 'monto'

function getEstado(cupon: CuponResponse): 'disponible' | 'usado' | 'vencido' {
  if (cupon.usado) return 'usado'
  if (cupon.fecha_vencimiento && new Date(cupon.fecha_vencimiento) < new Date(new Date().toDateString())) return 'vencido'
  return 'disponible'
}

export default function CantinaCuponesPage() {
  const [step, setStep] = useState<Step>('buscar')
  const [codigo, setCodigo] = useState('')
  const [cupon, setCupon] = useState<CuponResponse | null>(null)
  const [montoCompra, setMontoCompra] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' }>({
    open: false, title: '', message: '', type: 'success'
  })

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      setError('Ingresa un codigo de cupon')
      return
    }
    try {
      setLoading(true)
      setError('')
      const data = await buscarCupon(codigo.trim())
      setCupon(data)
      const estado = getEstado(data)
      if (estado === 'usado') {
        setError('Este cupon ya fue utilizado')
        return
      }
      if (estado === 'vencido') {
        setError('Este cupon esta vencido')
        return
      }
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cupon no encontrado')
    } finally {
      setLoading(false)
    }
  }

  const handleCanjear = async () => {
    if (!cupon) return
    const monto = parseFloat(montoCompra)
    if (!monto || monto <= 0) {
      setError('Ingresa un monto valido')
      return
    }
    try {
      setLoading(true)
      setError('')
      const result = await canjearCupon(cupon.id, monto)
      setNotification({
        open: true,
        title: 'Cupon canjeado',
        message: `Descuento de $${Number(result.monto_descuento).toLocaleString()} aplicado. Total a cobrar: $${Number(result.monto_total).toLocaleString()}`,
        type: 'success'
      })
    } catch (err) {
      setNotification({
        open: true,
        title: 'Error',
        message: err instanceof Error ? err.message : 'Error al canjear',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('buscar')
    setCodigo('')
    setCupon(null)
    setMontoCompra('')
    setError('')
  }

  const calcDescuento = (): { descuento: number; total: number } | null => {
    if (!cupon || !montoCompra) return null
    const monto = parseFloat(montoCompra)
    if (!monto || monto <= 0) return null
    let descuento: number
    if (cupon.tipo_descuento === 'porcentaje') {
      descuento = Math.round(monto * cupon.valor_descuento / 100 * 100) / 100
    } else {
      descuento = Math.min(cupon.valor_descuento, monto)
    }
    return { descuento, total: Math.round((monto - descuento) * 100) / 100 }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Validar Cupon</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ingresa el codigo del cupon del jugador</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-5">
        {/* Step: Buscar */}
        {step === 'buscar' && (
          <>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Codigo del cupon</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError('') }}
                placeholder="Ej: CUP-ABC123"
                className={`w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-primary ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>
            <button
              onClick={handleBuscar}
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Buscando...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">search</span> Buscar cupon</>
              )}
            </button>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && cupon && (
          <>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-primary">
                {cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento.toLocaleString()}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{cupon.titulo}</p>
              <p className="text-xs text-slate-400 font-mono mt-1">{cupon.codigo}</p>
            </div>
            {cupon.jugadores && (
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-900 dark:text-white font-medium">
                  {cupon.jugadores.apellido} {cupon.jugadores.nombre}
                </p>
                <p className="text-xs text-slate-500">DNI: {cupon.jugadores.dni}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={resetForm}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={() => setStep('monto')}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors">
                Aplicar descuento
              </button>
            </div>
          </>
        )}

        {/* Step: Monto */}
        {step === 'monto' && cupon && (
          <>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">Monto de la compra ($)</label>
              <input
                type="number"
                value={montoCompra}
                onChange={(e) => { setMontoCompra(e.target.value); setError('') }}
                placeholder="Ej: 5000"
                className={`w-full px-3 py-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white text-lg font-bold text-center placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-primary ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                min="1"
              />
              {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            </div>

            {calcDescuento() && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-slate-900 dark:text-white">${parseFloat(montoCompra).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Descuento ({cupon.tipo_descuento === 'porcentaje' ? `${cupon.valor_descuento}%` : `$${cupon.valor_descuento}`})
                  </span>
                  <span className="text-green-500 font-medium">-${calcDescuento()!.descuento.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-900 dark:text-white font-bold">Total a cobrar</span>
                    <span className="text-slate-900 dark:text-white font-bold text-lg">${calcDescuento()!.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setStep('preview'); setMontoCompra(''); setError('') }}
                className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-medium transition-colors">
                Volver
              </button>
              <button onClick={handleCanjear} disabled={loading}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Canjeando...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">check_circle</span> Confirmar canje</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <NotificationModal
        isOpen={notification.open}
        onClose={() => { setNotification(prev => ({ ...prev, open: false })); if (notification.type === 'success') resetForm() }}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}
