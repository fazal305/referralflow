import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'
import { apiGet } from '../services/apiClient'
import { listOpenTasks } from '../services/tasks'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { REFERRAL_STAGES } from '../config/constants'

function buildMonthlySeries(referrals) {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }), count: 0 }
  })
  referrals.forEach((r) => {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.count += 1
  })
  return months
}

function fetchDashboardData() {
  return apiGet('/dashboard')
}

function currency(n) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function DashboardPage() {
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['dashboard-referrals'],
    queryFn: fetchDashboardData,
  })
  const { data: tasks } = useQuery({
    queryKey: ['open-tasks'],
    queryFn: listOpenTasks,
  })

  if (isLoading) return <PageLoader label="Loading dashboard…" />

  const total = referrals?.length || 0

  if (total === 0) {
    return (
      <EmptyState
        title="No referrals yet."
        description="Your first referral can come from a client who had a great experience with your work. Add a client, then send them a referral request."
        action={
          <Button as={Link} to="/clients">
            Go to Clients
          </Button>
        }
      />
    )
  }

  const pending = referrals.filter((r) => r.stage === 'new').length
  const qualified = referrals.filter((r) => r.stage === 'qualified').length
  const won = referrals.filter((r) => r.stage === 'won')
  const lost = referrals.filter((r) => r.stage === 'lost').length
  const conversionRate = total > 0 ? Math.round((won.length / total) * 100) : 0
  const pipelineValue = referrals
    .filter((r) => !['won', 'lost'].includes(r.stage))
    .reduce((sum, r) => sum + (Number(r.potential_value) || 0), 0)
  const revenue = won.reduce((sum, r) => sum + (Number(r.actual_value) || 0), 0)

  const stats = [
    { label: 'Total Referrals', value: total },
    { label: 'Pending Introductions', value: pending },
    { label: 'Qualified Leads', value: qualified },
    { label: 'Won Referrals', value: won.length },
    { label: 'Conversion Rate', value: `${conversionRate}%` },
    { label: 'Pipeline Value', value: currency(pipelineValue) },
    { label: 'Revenue From Referrals', value: currency(revenue) },
    { label: 'Lost', value: lost },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          What's happening across your referral pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-[var(--color-text-faint)]">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Needs attention
          </h2>
          {tasks?.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {tasks.slice(0, 6).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <span>{t.title}</span>
                  {t.due_at && (
                    <span className="text-xs text-[var(--color-text-faint)]">
                      {new Date(t.due_at).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Nothing pending. You're all caught up.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Pipeline by stage
          </h2>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={REFERRAL_STAGES.map((s) => ({
                  label: s.label,
                  count: referrals.filter((r) => r.stage === s.id).length,
                }))}
                margin={{ left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                  }}
                />
                <Bar dataKey="count" fill="var(--color-accent-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Referrals over time
        </h2>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={buildMonthlySeries(referrals)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-accent-500)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
