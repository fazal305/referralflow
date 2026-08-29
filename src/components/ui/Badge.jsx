import clsx from 'clsx'

const tones = {
  neutral: 'bg-black/5 text-[var(--color-text-muted)]',
  accent: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)]',
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  warning: 'bg-[var(--color-warning-50)] text-[var(--color-warning-700)]',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
  info: 'bg-[var(--color-info-50)] text-[var(--color-info-700)]',
}

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
