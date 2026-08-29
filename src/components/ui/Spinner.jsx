import clsx from 'clsx'

export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
      <Spinner className="h-6 w-6" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
