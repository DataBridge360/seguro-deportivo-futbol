'use client'

import { useState, useRef, useEffect } from 'react'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

type ViewMode = 'days' | 'months' | 'years'

export default function DatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', hasError = false }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const ref = useRef<HTMLDivElement>(null)
  const yearGridRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  // Year range start for year grid (shows 12 years at a time)
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12)

  useEffect(() => {
    if (open && value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setYearRangeStart(Math.floor(d.getFullYear() / 12) * 12)
    }
    if (open) {
      setViewMode('years')
    }
  }, [open, value])

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

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const selectMonth = (month: number) => {
    setViewMonth(month)
    setViewMode('days')
  }

  const selectYear = (year: number) => {
    setViewYear(year)
    setYearRangeStart(Math.floor(year / 12) * 12)
    setViewMode('months')
  }

  const isSelected = (day: number): boolean => {
    if (!parsed) return false
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day
  }

  const isToday = (day: number): boolean => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:border-primary text-left ${hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-slate-900 dark:text-white shrink-0">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl shadow-black/10 dark:shadow-black/30 p-3 w-[280px]">

          {/* ===== DAYS VIEW ===== */}
          {viewMode === 'days' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearRangeStart(Math.floor(viewYear / 12) * 12)
                    setViewMode('months')
                  }}
                  className="text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  {MONTHS[viewMonth]} {viewYear}
                </button>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const selected = isSelected(day)
                  const todayMark = isToday(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={`h-8 w-full rounded-md text-xs font-medium transition-colors
                        ${selected
                          ? 'bg-primary text-white'
                          : todayMark
                            ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ===== MONTHS VIEW ===== */}
          {viewMode === 'months' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setViewYear(viewYear - 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearRangeStart(Math.floor(viewYear / 12) * 12)
                    setViewMode('years')
                  }}
                  className="text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-md transition-colors"
                >
                  {viewYear}
                </button>
                <button type="button" onClick={() => setViewYear(viewYear + 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS_SHORT.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMonth(idx)}
                    className={`py-2.5 rounded-md text-sm font-medium transition-colors
                      ${viewMonth === idx && parsed?.getFullYear() === viewYear
                        ? 'bg-primary text-white'
                        : viewMonth === idx
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ===== YEARS VIEW ===== */}
          {viewMode === 'years' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setYearRangeStart(yearRangeStart - 12)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-slate-900 dark:text-white text-sm font-medium">
                  {yearRangeStart} – {yearRangeStart + 11}
                </span>
                <button type="button" onClick={() => setYearRangeStart(yearRangeStart + 12)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5" ref={yearGridRef}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const year = yearRangeStart + i
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => selectYear(year)}
                      className={`py-2.5 rounded-md text-sm font-medium transition-colors
                        ${year === viewYear
                          ? 'bg-primary text-white'
                          : year === today.getFullYear()
                            ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }
                      `}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
