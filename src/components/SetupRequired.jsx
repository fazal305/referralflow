import { Card } from './ui/Card'

export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <Card className="max-w-lg p-8">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Supabase isn't configured yet
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          ReferralFlow needs a Supabase project to store clients, referrals,
          and templates. Copy{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            .env.example
          </code>{' '}
          to{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            .env.local
          </code>{' '}
          and fill in your project URL and anon key from{' '}
          <span className="font-medium">
            Supabase Dashboard → Project Settings → API
          </span>
          , then restart the dev server.
        </p>
      </Card>
    </div>
  )
}
