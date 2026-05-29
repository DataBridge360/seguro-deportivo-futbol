'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function formatDisplay(timeStr: string): string {
  if (!timeStr) return ''
  const [hour = '00', minute = '00'] = timeStr.split(':')
  return `${hour}:${minute}`
}

export default function TimePicker({
  value,
  onChange,
  placeholder = 'hh:mm',
  hasError = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [hour, minute] = value ? value.split(':') : ['12', '00']
  const selectedHour = hour || '12'
  const selectedMinute = minute || '00'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectTime = (nextHour: string, nextMinute: string) => {
    onChange(`${nextHour}:${nextMinute}`)
    setOpen(false)
  }

  const picker = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onMouseDown={() => setOpen(false)} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Horario</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatDisplay(value || '12:00')}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Hora</p>
            <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => selectTime(h, selectedMinute)}
                  className={cn(
                    'h-10 rounded-lg text-sm font-medium transition-colors',
                    h === selectedHour
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Minutos</p>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectTime(selectedHour, m)}
                  className={cn(
                    'h-10 rounded-lg text-sm font-medium transition-colors',
                    m === selectedMinute
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                >
                  :{m}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Formato 24 hs, sin AM/PM.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:border-primary text-left transition-colors',
          hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        )}
      >
        <span className="material-symbols-outlined text-slate-900 dark:text-white text-[18px] shrink-0">schedule</span>
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && mounted && createPortal(picker, document.body)}
    </div>
  )
}
