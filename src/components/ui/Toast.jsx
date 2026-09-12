import clsx from 'clsx'
import { useToastStore } from '../../stores/toastStore'

const tones = {
  success: 'bg-[var(--color-success-50)] text-[var(--color-success-700)]',
  danger: 'bg-[var(--color-danger-50)] text-[var(--color-danger-700)]',
  info: 'bg-[var(--color-info-50)] text-[var(--color-info-700)]',
}

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts)
  const dismissToast = useToastStore((s) => s.dismissToast)

  if (!toasts.length) return null

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={clsx(
            'flex w-full max-w-sm items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium shadow-[var(--shadow-md)]',
            tones[toast.tone] || tones.success,
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
