'use client'

import { useState } from 'react'

// Tailwind needs literal class names, so the initial's size is looked up from the size token
const INITIAL_SIZE: Record<string, string> = {
  'size-8': 'text-sm',
  'size-10': 'text-lg',
  'size-12': 'text-xl',
  'size-14': 'text-2xl',
  'size-16': 'text-2xl',
  'size-20': 'text-3xl',
  'size-24': 'text-4xl',
}

function initialClass(className: string) {
  const token = className.split(/\s+/).find(c => c in INITIAL_SIZE)
  return token ? INITIAL_SIZE[token] : 'text-xl'
}

export default function TeamLogo({
  src,
  name,
  className = 'size-12',
  textClassName,
}: {
  src: string | null | undefined
  name: string
  className?: string
  textClassName?: string
}) {
  return <TeamLogoInner key={src ?? ''} src={src} name={name} className={className} textClassName={textClassName} />
}

function TeamLogoInner({
  src,
  name,
  className,
  textClassName,
}: {
  src: string | null | undefined
  name: string
  className: string
  textClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = !!src && !failed
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        showImage ? 'bg-white' : 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300'
      } ${className}`}
    >
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="relative flex size-full items-center justify-center" aria-hidden>
          <span
            className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[2.25em] opacity-25"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield
          </span>
          <span className={`relative font-extrabold ${textClassName ?? initialClass(className)}`}>
            {name.trim().charAt(0).toUpperCase()}
          </span>
        </span>
      )}
    </div>
  )
}
