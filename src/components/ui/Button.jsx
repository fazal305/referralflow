import clsx from 'clsx'

const variants = {
  primary:
    'bg-[var(--color-accent-500)] text-white hover:bg-[var(--color-accent-600)] shadow-sm',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-accent-50)]',
  ghost: 'text-[var(--color-text)] hover:bg-black/5',
  danger: 'bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-700)]',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  as: Component = 'button',
  ...props
}) {
  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-[var(--duration-fast)] disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
