export default function TeamLogo({
  src,
  name,
  className = 'size-12',
}: {
  src: string | null | undefined
  name: string
  className?: string
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300 ${className}`}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <span className="relative flex size-full items-center justify-center" aria-hidden>
          <span
            className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[2.25em] opacity-25"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            shield
          </span>
          <span className="relative text-base font-extrabold">{name.trim().charAt(0).toUpperCase()}</span>
        </span>
      )}
    </div>
  )
}
