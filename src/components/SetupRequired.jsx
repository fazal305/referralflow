import { Card } from './ui/Card'

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <Card className="max-w-lg p-8">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Backend isn't configured yet
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          ReferralFlow needs a Neon Postgres database and admin credentials to
          run. Set{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            DATABASE_URL
          </code>
          ,{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            SESSION_SECRET
          </code>
          ,{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            ADMIN_EMAIL
          </code>{' '}
          and{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            ADMIN_PASSWORD_HASH
          </code>{' '}
          in your environment (see README) and restart.
        </p>
      </Card>
    </div>
  )
}
