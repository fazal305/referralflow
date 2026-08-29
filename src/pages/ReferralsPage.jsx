import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listReferrals, updateReferralStage } from '../services/referrals'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { REFERRAL_STAGES } from '../config/constants'

function currency(n) {
  if (!n && n !== 0) return null
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n)
}

function ReferralCard({ referral }) {
  const queryClient = useQueryClient()
  const stageMutation = useMutation({
    mutationFn: (stage) => updateReferralStage(referral.id, stage),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referrals'] }),
  })

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to={`/referrals/${referral.id}`}
            className="font-medium text-[var(--color-text)] hover:underline"
          >
            {referral.lead_name}
          </Link>
          {referral.referrer_name && (
            <p className="text-xs text-[var(--color-text-faint)]">
              via {referral.referrer_name}
            </p>
          )}
        </div>
        {currency(referral.potential_value) && (
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            {currency(referral.potential_value)}
          </span>
        )}
      </div>

      <Select
        aria-label={`Stage for ${referral.lead_name}`}
        className="mt-3 h-8 text-xs"
        value={referral.stage}
        onChange={(e) => stageMutation.mutate(e.target.value)}
      >
        {REFERRAL_STAGES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
    </Card>
  )
}

export function ReferralsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', search, stageFilter],
    queryFn: () => listReferrals({ search, stage: stageFilter || undefined }),
  })

  if (isLoading) return <PageLoader label="Loading pipeline…" />

  if (!referrals?.length && !search && !stageFilter) {
    return (
      <EmptyState
        title="No referrals yet."
        description="Referrals appear here once a client shares their referral link, or you add one manually from a client's profile."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Referral Pipeline
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Track every referred lead from submission to close.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by lead or referrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Search referrals"
        />
        <Select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="max-w-[200px]"
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          {REFERRAL_STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {referrals?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {referrals.map((r) => (
            <ReferralCard key={r.id} referral={r} />
          ))}
        </div>
      ) : (
        <EmptyState title="No referrals match your filters." />
      )}
    </div>
  )
}
