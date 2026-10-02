import SafeImage from '@/components/ui/SafeImage'

/**
 * The announcement tile exactly as the jugador home shows it (300x94, 360x113
 * from sm). The club panel reuses it so the preview matches what players see.
 */
export default function AnuncioBanner({
  src,
  alt,
  dimmed = false,
  className = '',
}: {
  src: string
  alt: string
  dimmed?: boolean
  className?: string
}) {
  return (
    <div
      className={`w-[300px] sm:w-[360px] max-w-full aspect-[300/94] shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}
    >
      <SafeImage
        src={src}
        alt={alt}
        icon="campaign"
        className={`h-full w-full object-cover ${dimmed ? 'opacity-50 grayscale' : ''}`}
      />
    </div>
  )
}
