'use client'

import { useState, type ReactNode } from 'react'

interface SafeImageProps {
  src: string | null | undefined
  alt?: string
  className?: string
  loading?: 'lazy' | 'eager'
  /** Custom fallback rendered when there is no src or the image fails to load */
  fallback?: ReactNode
  /** Material Symbols icon used by the default fallback */
  icon?: string
  /** Size/color classes for the default fallback icon */
  iconClassName?: string
}

function SafeImageInner({
  src,
  alt = '',
  className = '',
  loading,
  fallback,
  icon = 'image',
  iconClassName = 'text-3xl',
}: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    if (fallback !== undefined) return <>{fallback}</>
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`${className} flex items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500`}
      >
        <span className={`material-symbols-outlined ${iconClassName}`} aria-hidden>
          {icon}
        </span>
      </span>
    )
  }

  return <img src={src} alt={alt} className={className} loading={loading} onError={() => setFailed(true)} />
}

// Keyed by src so the error state resets whenever the source changes
export default function SafeImage(props: SafeImageProps) {
  return <SafeImageInner key={props.src ?? ''} {...props} />
}
