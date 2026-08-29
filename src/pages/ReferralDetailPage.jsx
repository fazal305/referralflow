import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getReferral,
  updateReferralStage,
  updateReferral,
  logEvent,
} from '../services/referrals'
import { listTemplates, renderTemplate } from '../services/templates'
import { createReward } from '../services/rewards'
import { PageLoader } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Select, Textarea, Label, Input } from '../components/ui/Input'
import { BUSINESS_NAME, REFERRAL_STAGES } from '../config/constants'

const STAGE_TONE = {
  new: 'neutral',
  contacted: 'info',
  qualified: 'accent',
  proposal: 'warning',
  negotiating: 'warning',
  won: 'success',
  lost: 'danger',
}

const THANK_YOU_CATEGORIES = {
  received: 'referral_received',
  contacted: 'lead_contacted',
  won: 'deal_won',
  lost: 'deal_lost',
}

function ThankReferrer({ referral }) {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })
  const [category, setCategory] = useState('received')
  const [copied, setCopied] = useState(false)

  const matchingTemplate = templates?.find(
    (t) => t.category === THANK_YOU_CATEGORIES[category],
  )
  const fallback = {
    received:
      'Hey {{clientName}}, thank you so much for the introduction to {{referralName}} — really appreciate you thinking of me!',
    contacted:
      "Quick update — I've reached out to {{referralName}} and we're talking. Thanks again for the referral!",
    won: "Great news — {{referralName}} is officially on board! Thank you so much for the introduction, {{clientName}}.",
    lost: "Wanted to close the loop — it didn't work out with {{referralName}} this time, but I really appreciate you thinking of me. Thank you!",
  }[category]

  const body = matchingTemplate?.body || fallback
  const rendered = renderTemplate(body, {
    clientName: referral.referrer_client?.name || referral.referrer_name || 'there',
    referralName: referral.lead_name,
    businessName: BUSINESS_NAME,
  })

  async function copy() {
    await navigator.clipboard.writeText(rendered)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-[var(--color-text)]">
        Thank the referrer
      </h2>
      <div className="mt-3">
        <Label htmlFor="thank-you-stage">Update to share</Label>
        <Select
          id="thank-you-stage"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="received">Referral received</option>
          <option value="contacted">Lead contacted</option>
          <option value="won">Deal won</option>
          <option value="lost">Deal lost</option>
        </Select>
      </div>
      <Textarea className="mt-3" rows={4} value={rendered} readOnly />
      <Button size="sm" variant="secondary" className="mt-3" onClick={copy}>
        {copied ? 'Copied!' : 'Copy message'}
      </Button>
    </Card>
  )
}

export function ReferralDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [rewardValue, setRewardValue] = useState('')

  const { data: referral, isLoading } = useQuery({
    queryKey: ['referral', id],
    queryFn: () => getReferral(id),
  })

  const stageMutation = useMutation({
    mutationFn: (stage) => updateReferralStage(id, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral', id] }),
  })

  const noteMutation = useMutation({
    mutationFn: async () => {
      await updateReferral(id, { notes: note })
      await logEvent(id, 'note_added', note)
    },
    onSuccess: () => {
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['referral', id] })
    },
  })

  const rewardMutation = useMutation({
    mutationFn: () =>
      createReward({
        referral_id: id,
        reward_type: 'custom',
        reward_value: rewardValue,
        trigger: 'manual',
        status: 'earned',
      }),
    onSuccess: () => {
      setRewardValue('')
      queryClient.invalidateQueries({ queryKey: ['referral', id] })
    },
  })

  if (isLoading) return <PageLoader label="Loading referral…" />
  if (!referral) return <p>Referral not found.</p>

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/referrals"
        className="text-sm text-[var(--color-text-muted)] hover:underline"
      >
        ← Back to pipeline
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            {referral.lead_name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {referral.lead_need || 'No stated need on file.'}
          </p>
        </div>
        <Badge tone={STAGE_TONE[referral.stage]}>
          {REFERRAL_STAGES.find((s) => s.id === referral.stage)?.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Referral details
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--color-text-faint)]">Referrer</dt>
                <dd className="text-[var(--color-text)]">
                  {referral.referrer_client?.name || referral.referrer_name || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-faint)]">Source</dt>
                <dd className="text-[var(--color-text)]">{referral.source}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-faint)]">Lead email</dt>
                <dd className="text-[var(--color-text)]">{referral.lead_email || '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-faint)]">Lead phone</dt>
                <dd className="text-[var(--color-text)]">{referral.lead_phone || '—'}</dd>
              </div>
            </dl>
            {referral.message && (
              <p className="mt-3 rounded-[var(--radius-md)] bg-black/5 p-3 text-sm text-[var(--color-text-muted)]">
                "{referral.message}"
              </p>
            )}

            <div className="mt-4">
              <Label htmlFor="stage-select">Move stage</Label>
              <Select
                id="stage-select"
                value={referral.stage}
                onChange={(e) => stageMutation.mutate(e.target.value)}
                className="max-w-xs"
              >
                {REFERRAL_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Activity timeline
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
              {referral.referral_events
                ?.slice()
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((event) => (
                  <li key={event.id} className="flex gap-3 text-sm">
                    <span className="w-20 shrink-0 text-xs text-[var(--color-text-faint)]">
                      {new Date(event.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[var(--color-text)]">
                      {event.description}
                    </span>
                  </li>
                ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <Input
                placeholder="Add a note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="Add note"
              />
              <Button
                size="sm"
                onClick={() => note.trim() && noteMutation.mutate()}
                disabled={noteMutation.isPending || !note.trim()}
              >
                Add
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <ThankReferrer referral={referral} />

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Reward
            </h2>
            {referral.referral_rewards?.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {referral.referral_rewards.map((r) => (
                  <li key={r.id} className="text-sm">
                    <Badge tone="accent">{r.status}</Badge>{' '}
                    <span className="text-[var(--color-text-muted)]">
                      {r.reward_value || r.reward_type}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                No reward recorded yet.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="e.g. 10% credit"
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
                aria-label="Reward value"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => rewardValue.trim() && rewardMutation.mutate()}
                disabled={rewardMutation.isPending || !rewardValue.trim()}
              >
                Log
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
