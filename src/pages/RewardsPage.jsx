import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRewardSettings, saveRewardSettings } from '../services/rewards'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select, Input, Label } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { REWARD_TRIGGERS, REWARD_TYPES } from '../config/constants'

export function RewardsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['reward-settings'],
    queryFn: getRewardSettings,
  })

  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const mutation = useMutation({
    mutationFn: () => saveRewardSettings(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reward-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    },
  })

  if (isLoading || !form) return <PageLoader label="Loading reward settings…" />

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Rewards
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Configure the default referral incentive. Referrals don't require a
          reward — "No incentive" is a valid, supported choice.
        </p>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="reward-type">Reward type</Label>
            <Select
              id="reward-type"
              value={form.reward_type}
              onChange={(e) => setForm({ ...form, reward_type: e.target.value })}
            >
              {REWARD_TYPES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>

          {form.reward_type !== 'none' && (
            <div>
              <Label htmlFor="reward-value">
                {form.reward_type === 'percentage'
                  ? 'Percentage value'
                  : 'Reward value / description'}
              </Label>
              <Input
                id="reward-value"
                placeholder={
                  form.reward_type === 'percentage' ? 'e.g. 10' : 'e.g. Rs. 5,000 credit'
                }
                value={form.reward_value || ''}
                onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label htmlFor="reward-trigger">Reward trigger</Label>
            <Select
              id="reward-trigger"
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
            >
              {REWARD_TRIGGERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="self-start"
          >
            {mutation.isPending ? 'Saving…' : saved ? 'Saved' : 'Save settings'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
