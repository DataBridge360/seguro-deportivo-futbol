'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  dateValue: string
  timeValue: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
  minDateTime?: string
  maxDateTime?: string
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDisplay(dateStr: string, timeStr: string): string {
  if (!dateStr && !timeStr) return ''
  const datePart = dateStr ? (() => {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  })() : ''
  const timePart = timeStr || '00:00'
  return datePart ? `${datePart} ${timePart}` : timePart
}

function toDateTimeValue(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null
  const value = new Date(`${dateStr}T${timeStr}:00`).getTime()
  return Number.isNaN(value) ? null : value
}

type ViewMode = 'days' | 'months' | 'years'

export default function DateTimePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  placeholder = 'dd/mm/aaaa 00:00',
  hasError = false,
  minDateTime,
  maxDateTime,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const parsed = dateValue ? new Date(`${dateValue}T00:00:00`) : null

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12)
  const [selectedHour, selectedMinute] = useMemo(() => {
    const [h = '00', m = '00'] = timeValue.split(':')
    return [h, m]
  }, [timeValue])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open && dateValue) {
      const d = new Date(`${dateValue}T00:00:00`)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setYearRangeStart(Math.floor(d.getFullYear() / 12) * 12)
    }
    if (open) setViewMode('days')
  }, [open, dateValue])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const minValue = minDateTime ? new Date(minDateTime).getTime() : null
  const maxValue = maxDateTime ? new Date(maxDateTime).getTime() : null

  const isTimeAllowed = (dateStr: string, timeStr: string) => {
    const value = toDateTimeValue(dateStr, timeStr)
    if (value === null) return false
    if (minValue !== null && value < minValue) return false
    if (maxValue !== null && value > maxValue) return false
    return true
  }

  const isDayAllowed = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const dateStr = `${viewYear}-${m}-${d}`
    const dayStart = toDateTimeValue(dateStr, '00:00')
    const dayEnd = toDateTimeValue(dateStr, '23:59')
    if (dayStart === null || dayEnd === null) return false
    if (maxValue !== null && dayStart > maxValue) return false
    if (minValue !== null && dayEnd < minValue) return false
    return true
  }

  const clampTimeForDate = (dateStr: string, timeStr: string) => {
    if (isTimeAllowed(dateStr, timeStr)) return timeStr
    if (minValue !== null) {
      const minDate = new Date(minValue)
      const minDateStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`
      if (dateStr === minDateStr) {
        return `${String(minDate.getHours()).padStart(2, '0')}:${String(minDate.getMinutes()).padStart(2, '0')}`
      }
    }
    if (maxValue !== null) {
      const maxDate = new Date(maxValue)
      const maxDateStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`
      if (dateStr === maxDateStr) {
        return `${String(maxDate.getHours()).padStart(2, '0')}:${String(maxDate.getMinutes()).padStart(2, '0')}`
      }
    }
    return timeStr
  }

  const selectDay = (day: number) => {
    if (!isDayAllowed(day)) return
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    const nextDate = `${viewYear}-${m}-${d}`
    const nextTime = clampTimeForDate(nextDate, timeValue || '00:00')
    onDateChange(nextDate)
    if (nextTime !== timeValue) onTimeChange(nextTime)
  }

  const selectTime = (hour: string, minute: string) => {
    const nextTime = `${hour}:${minute}`
    if (!dateValue || !isTimeAllowed(dateValue, nextTime)) return
    onTimeChange(nextTime)
  }

  const picker = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onMouseDown={() => setOpen(false)} />
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Fecha y hora</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {formatDisplay(dateValue, timeValue) || 'Seleccionar'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-3">
            {viewMode === 'days' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => {
                    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
                    else setViewMonth(viewMonth - 1)
                  }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button type="button" onClick={() => { setYearRangeStart(Math.floor(viewYear / 12) * 12); setViewMode('months') }} className="text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-md transition-colors">
                    {MONTHS[viewMonth]} {viewYear}
                  </button>
                  <button type="button" onClick={() => {
                    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
                    else setViewMonth(viewMonth + 1)
                  }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isSelected = !!parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day
                    const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
                    const disabled = !isDayAllowed(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => selectDay(day)}
                        disabled={disabled}
                        className={cn(
                          'h-8 w-full rounded-md text-xs font-medium transition-colors',
                          disabled
                            ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                            : isSelected
                            ? 'bg-primary text-white'
                            : isToday
                              ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {viewMode === 'months' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setViewYear(viewYear - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button type="button" onClick={() => { setYearRangeStart(Math.floor(viewYear / 12) * 12); setViewMode('years') }} className="text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-md transition-colors">
                    {viewYear}
                  </button>
                  <button type="button" onClick={() => setViewYear(viewYear + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS_SHORT.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setViewMonth(idx); setViewMode('days') }}
                      className={cn(
                        'py-2.5 rounded-md text-sm font-medium transition-colors',
                        viewMonth === idx && parsed?.getFullYear() === viewYear
                          ? 'bg-primary text-white'
                          : viewMonth === idx
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}

            {viewMode === 'years' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setYearRangeStart(yearRangeStart - 12)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <span className="text-slate-900 dark:text-white text-sm font-medium">{yearRangeStart} – {yearRangeStart + 11}</span>
                  <button type="button" onClick={() => setYearRangeStart(yearRangeStart + 12)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const year = yearRangeStart + i
                    return (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setViewYear(year)
                          setYearRangeStart(Math.floor(year / 12) * 12)
                          setViewMode('months')
                        }}
                        className={cn(
                          'py-2.5 rounded-md text-sm font-medium transition-colors',
                          year === viewYear
                            ? 'bg-primary text-white'
                            : year === today.getFullYear()
                              ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        )}
                      >
                        {year}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-3">
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Hora</p>
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {HOURS.map((h) => {
                  const disabled = !!dateValue && !isTimeAllowed(dateValue, `${h}:${selectedMinute}`)
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => selectTime(h, selectedMinute)}
                      disabled={disabled}
                      className={cn(
                        'h-10 rounded-lg text-sm font-medium transition-colors',
                        disabled
                          ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
                          : h === selectedHour
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Minutos</p>
              <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {MINUTES.map((m) => {
                  const disabled = !!dateValue && !isTimeAllowed(dateValue, `${selectedHour}:${m}`)
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectTime(selectedHour, m)}
                      disabled={disabled}
                      className={cn(
                        'h-10 rounded-lg text-sm font-medium transition-colors',
                        disabled
                          ? 'cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600'
                          : m === selectedMinute
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      :{m}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
              Selección en formato 24 hs.
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
          'w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:border-primary text-left transition-colors',
          hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-slate-900 dark:text-white text-[18px] shrink-0">schedule</span>
          <span className={dateValue || timeValue ? 'text-slate-900 dark:text-white truncate' : 'text-slate-400 dark:text-slate-500 truncate'}>
            {dateValue || timeValue ? formatDisplay(dateValue, timeValue) : placeholder}
          </span>
        </span>
        <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[18px] shrink-0">expand_more</span>
      </button>

      {open && mounted && createPortal(picker, document.body)}
    </div>
  )
}
