import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-6 text-center">
      <p className="text-sm font-medium text-[var(--color-accent-600)]">404</p>
      <h1 className="text-lg font-semibold text-[var(--color-text)]">
        Page not found
      </h1>
      <Button as={Link} to="/" variant="secondary">
        Back home
      </Button>
    </div>
  )
}
