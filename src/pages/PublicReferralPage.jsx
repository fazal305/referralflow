import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getReferrerDisplayName, submitPublicReferral } from '../services/publicReferral'
import { Button } from '../components/ui/Button'
import { Input, Label, Textarea } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { APP_NAME, BUSINESS_NAME } from '../config/constants'

export function PublicReferralPage() {
  const { code } = useParams()
  const [form, setForm] = useState({
    referrerName: '',
    referrerEmail: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    leadNeed: '',
    message: '',
  })
  const [error, setError] = useState(null)

  const { data: referrer, isLoading, isError } = useQuery({
    queryKey: ['referrer-display', code],
    queryFn: () => getReferrerDisplayName(code),
  })

  const mutation = useMutation({
    mutationFn: () => submitPublicReferral(code, form),
    onError: (err) => setError(err.message),
  })

  if (isLoading) return <PageLoader label="Loading…" />

  if (isError || !referrer || referrer.code_is_active === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[var(--color-bg)] px-6 text-center">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          This referral link isn't active
        </h1>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          Double-check the link, or ask the person who shared it for a new one.
        </p>
      </div>
    )
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-50)] text-[var(--color-success-700)]">
          ✓
        </div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          Thanks — referral sent!
        </h1>
        <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
          {BUSINESS_NAME} will follow up soon. {referrer.client_name} will be
          notified that this went through.
        </p>
      </div>
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.leadName.trim()) {
      setError('Please enter the name of the person or business you are referring.')
      return
    }
    setError(null)
    mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-[var(--color-accent-600)]">
          {APP_NAME}
        </p>
        <h1 className="mt-2 text-center text-xl font-semibold text-[var(--color-text)]">
          Recommended by {referrer.client_name}
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
          {referrer.client_name} referred you to {BUSINESS_NAME}. Fill in a
          few details and we'll take it from here.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <Label htmlFor="referrerName">Your name</Label>
            <Input
              id="referrerName"
              value={form.referrerName}
              onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="referrerEmail">Your email</Label>
            <Input
              id="referrerEmail"
              type="email"
              value={form.referrerEmail}
              onChange={(e) => setForm({ ...form, referrerEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="leadName">Friend / business name *</Label>
            <Input
              id="leadName"
              required
              value={form.leadName}
              onChange={(e) => setForm({ ...form, leadName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="leadEmail">Their email</Label>
            <Input
              id="leadEmail"
              type="email"
              value={form.leadEmail}
              onChange={(e) => setForm({ ...form, leadEmail: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="leadPhone">Their phone</Label>
            <Input
              id="leadPhone"
              value={form.leadPhone}
              onChange={(e) => setForm({ ...form, leadPhone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="leadNeed">What do they need?</Label>
            <Input
              id="leadNeed"
              placeholder="e.g. a website, a web app…"
              value={form.leadNeed}
              onChange={(e) => setForm({ ...form, leadNeed: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="message">Anything else? (optional)</Label>
            <Textarea
              id="message"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-[var(--color-danger-600)]">
              {error}
            </p>
          )}
          {mutation.isError && (
            <p role="alert" className="text-sm text-[var(--color-danger-600)]">
              {mutation.error.message}
            </p>
          )}

          <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? 'Sending…' : 'Send referral'}
          </Button>
        </form>
      </div>
    </div>
  )
}
