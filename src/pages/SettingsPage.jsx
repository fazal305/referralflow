import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { WIN_MOMENT_TRIGGERS, BUSINESS_NAME, PUBLIC_APP_URL } from '../config/constants'

export function SettingsPage() {
  const [trigger, setTrigger] = useState(
    () => localStorage.getItem('referralflow:win-moment-trigger') || '48h',
  )

  function handleChange(id) {
    setTrigger(id)
    localStorage.setItem('referralflow:win-moment-trigger', id)
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Workspace configuration for {BUSINESS_NAME}.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Referral timing (Win Moment)
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          When should a referral request be suggested after a project is
          marked completed?
        </p>
        <fieldset className="mt-3 flex flex-col gap-2">
          <legend className="sr-only">Referral timing trigger</legend>
          {WIN_MOMENT_TRIGGERS.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 text-sm text-[var(--color-text)]"
            >
              <input
                type="radio"
                name="win-moment-trigger"
                value={t.id}
                checked={trigger === t.id}
                onChange={() => handleChange(t.id)}
                className="accent-[var(--color-accent-500)]"
              />
              {t.label}
            </label>
          ))}
        </fieldset>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Public referral URL base
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Referral links are generated as{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            {PUBLIC_APP_URL}/r/CODE
          </code>
          . Set{' '}
          <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
            VITE_PUBLIC_APP_URL
          </code>{' '}
          in your environment once you have a production domain.
        </p>
      </Card>
    </div>
  )
}
