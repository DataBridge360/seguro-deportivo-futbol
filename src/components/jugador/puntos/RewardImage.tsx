export default function RewardImage({
  src,
  alt,
  className = '',
  iconClass = 'text-4xl',
}: {
  src: string | null | undefined
  alt: string
  className?: string
  iconClass?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <span className={`material-symbols-outlined ${iconClass}`} aria-hidden>
          redeem
        </span>
      )}
    </div>
  )
}
