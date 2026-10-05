'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hasError?: boolean
  // 'responsive' keeps 'md' from sm up and turns into a large bottom sheet on phones
  size?: 'md' | 'lg' | 'responsive'
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

export default function DatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', hasError = false, size = 'md' }: DatePickerProps) {
  const isLg = size === 'lg'
  const isResponsive = size === 'responsive'
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor((parsed?.getFullYear() ?? today.getFullYear()) / 12) * 12)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open && value) {
      const d = new Date(value + 'T00:00:00')
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setYearRangeStart(Math.floor(d.getFullYear() / 12) * 12)
    }
    if (open) setViewMode('years')
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
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const selectMonth = (month: number) => { setViewMonth(month); setViewMode('days') }

  const selectYear = (year: number) => {
    setViewYear(year)
    setYearRangeStart(Math.floor(year / 12) * 12)
    setViewMode('months')
  }

  const isSelected = (day: number): boolean => {
    if (!parsed) return false
    return parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day
  }

  const isToday = (day: number): boolean =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day

  // Size-dependent class fragments. 'md' preserves the original class strings
  // byte-for-byte so existing callers (productor pages, etc.) are unaffected.
  // 'responsive' pairs phone-sized classes with the 'md' ones behind `sm:`.
  const navButtonClass = `${isLg ? 'p-2.5' : isResponsive ? 'p-3 sm:p-1' : 'p-1'} hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-900 dark:text-white`
  const navIconClass = isLg ? 'w-5 h-5' : isResponsive ? 'w-6 h-6 sm:w-4 sm:h-4' : 'w-4 h-4'
  const headerTitleClass = isLg
    ? 'text-slate-900 dark:text-white text-base font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 py-2 px-3 rounded-md transition-colors'
    : isResponsive
    ? 'text-slate-900 dark:text-white text-lg font-semibold sm:text-sm sm:font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2.5 sm:px-2 sm:py-1 rounded-md transition-colors'
    : 'text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-md transition-colors'
  const yearRangeLabelClass = isLg
    ? 'text-slate-900 dark:text-white text-base font-semibold'
    : isResponsive
    ? 'text-slate-900 dark:text-white text-lg font-semibold sm:text-sm sm:font-medium'
    : 'text-slate-900 dark:text-white text-sm font-medium'
  const weekdayClass = isLg
    ? 'text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-1'
    : isResponsive
    ? 'text-center text-sm sm:text-[11px] font-medium text-slate-500 sm:text-slate-400 dark:text-slate-500 py-2 sm:py-1'
    : 'text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1'
  const dayGridClass = isLg ? 'grid grid-cols-7 gap-1' : isResponsive ? 'grid grid-cols-7 gap-1 sm:gap-0' : 'grid grid-cols-7'
  const dayButtonBaseClass = isLg
    ? 'h-11 w-full rounded-md text-base font-semibold transition-colors'
    : isResponsive
    ? 'h-12 sm:h-8 w-full rounded-lg sm:rounded-md text-lg sm:text-xs font-semibold sm:font-medium transition-colors'
    : 'h-8 w-full rounded-md text-xs font-medium transition-colors'
  const monthYearButtonBaseClass = isLg
    ? 'py-3.5 rounded-md text-base font-medium transition-colors'
    : isResponsive
    ? 'py-4 sm:py-2.5 rounded-lg sm:rounded-md text-lg sm:text-sm font-medium transition-colors'
    : 'py-2.5 rounded-md text-sm font-medium transition-colors'
  const panelClass = isResponsive
    ? 'relative bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-xl sm:border sm:p-3 sm:w-[280px] sm:max-h-none sm:overflow-visible'
    : `relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl ${isLg ? 'p-4 w-[340px] max-w-[calc(100vw-2rem)]' : 'p-3 w-[280px]'}`
  const triggerClass = isLg
    ? `w-full flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-lg text-base focus:outline-none focus:border-primary text-left ${hasError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`
    : isResponsive
    ? `w-full flex items-center gap-2 px-4 min-h-[48px] py-2.5 sm:min-h-0 sm:px-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-base sm:text-sm focus:outline-none focus:border-primary text-left ${hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`
    : `w-full flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border rounded-lg text-sm focus:outline-none focus:border-primary text-left ${hasError ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`
  const triggerIconClass = `${isLg ? 'w-5 h-5' : isResponsive ? 'w-5 h-5 sm:w-4 sm:h-4' : 'w-4 h-4'} text-slate-900 dark:text-white shrink-0`

  const calendar = (
    <div className={`fixed inset-0 z-[100] flex justify-center ${isResponsive ? 'items-end sm:items-center sm:p-4' : 'items-center p-4'}`} ref={ref}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onMouseDown={() => setOpen(false)} />

      {/* Calendar panel */}
      <div className={panelClass}>
        {isResponsive && (
          <div className="sm:hidden mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />
        )}

        {/* DAYS VIEW */}
        {viewMode === 'days' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prevMonth} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={() => { setYearRangeStart(Math.floor(viewYear / 12) * 12); setViewMode('months') }} className={headerTitleClass}>
                {MONTHS[viewMonth]} {viewYear}
              </button>
              <button type="button" onClick={nextMonth} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className={weekdayClass}>{d}</div>
              ))}
            </div>
            <div className={dayGridClass}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const selected = isSelected(day)
                const todayMark = isToday(day)
                return (
                  <button key={day} type="button" onClick={() => selectDay(day)}
                    className={`${dayButtonBaseClass} ${
                      selected ? 'bg-primary text-white'
                      : todayMark ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* MONTHS VIEW */}
        {viewMode === 'months' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setViewYear(viewYear - 1)} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <button type="button" onClick={() => { setYearRangeStart(Math.floor(viewYear / 12) * 12); setViewMode('years') }} className={headerTitleClass}>
                {viewYear}
              </button>
              <button type="button" onClick={() => setViewYear(viewYear + 1)} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS_SHORT.map((m, idx) => (
                <button key={m} type="button" onClick={() => selectMonth(idx)}
                  className={`${monthYearButtonBaseClass} ${
                    viewMonth === idx && parsed?.getFullYear() === viewYear ? 'bg-primary text-white'
                    : viewMonth === idx ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </>
        )}

        {/* YEARS VIEW */}
        {viewMode === 'years' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => setYearRangeStart(yearRangeStart - 12)} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className={yearRangeLabelClass}>{yearRangeStart} – {yearRangeStart + 11}</span>
              <button type="button" onClick={() => setYearRangeStart(yearRangeStart + 12)} className={navButtonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={navIconClass}><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }).map((_, i) => {
                const year = yearRangeStart + i
                return (
                  <button key={year} type="button" onClick={() => selectYear(year)}
                    className={`${monthYearButtonBaseClass} ${
                      year === viewYear ? 'bg-primary text-white'
                      : year === today.getFullYear() ? 'bg-slate-100 dark:bg-slate-700 text-primary font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}>
                    {year}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {isResponsive && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="sm:hidden mt-4 w-full min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-700 text-base font-semibold text-slate-700 dark:text-slate-200 active:scale-[0.98] transition-transform"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={triggerClass}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={triggerIconClass}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && mounted && createPortal(calendar, document.body)}
    </div>
  )
}
