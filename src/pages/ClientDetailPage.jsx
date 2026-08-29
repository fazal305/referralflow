import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClient, ensureReferralCode, updateClient } from '../services/clients'
import { listTemplates, renderTemplate } from '../services/templates'
import { PageLoader } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Select, Textarea, Label } from '../components/ui/Input'
import { BUSINESS_NAME, PUBLIC_APP_URL } from '../config/constants'

function useCopy() {
  const [copied, setCopied] = useState(null)
  async function copy(text, key) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
  }
  return { copy, copied }
}

function ReferralRequestBuilder({ client }) {
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })
  const requestTemplates = templates?.filter((t) => t.category === 'referral_request') || []
  const [templateId, setTemplateId] = useState('')
  const [customBody, setCustomBody] = useState('')
  const { copy, copied } = useCopy()

  const activeTemplate = requestTemplates.find((t) => t.id === templateId)
  const referralLink = client.referral_codes?.[0]
    ? `${PUBLIC_APP_URL}/r/${client.referral_codes[0].code}`
    : null

  const baseBody =
    customBody ||
    activeTemplate?.body ||
    `Hey {{clientName}},\n\nI'm glad we were able to get your project delivered successfully. I'm currently taking on a few new projects — if you know someone who could use similar work, I'd really appreciate an introduction.\n\nYou can share this link with them: {{referralCode}}\n\nThanks so much,\n{{businessName}}`

  const rendered = renderTemplate(baseBody, {
    clientName: client.name,
    businessName: BUSINESS_NAME,
    referralCode: referralLink || '(generate a referral link first)',
  })

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-[var(--color-text)]">
        Referral request builder
      </h2>

      <div className="mt-3">
        <Label htmlFor="template-select">Template</Label>
        <Select
          id="template-select"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
        >
          <option value="">Default message</option>
          {requestTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3">
        <Label htmlFor="message-body">Message</Label>
        <Textarea
          id="message-body"
          rows={7}
          value={customBody || rendered}
          onChange={(e) => setCustomBody(e.target.value)}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => copy(customBody || rendered, 'message')}
        >
          {copied === 'message' ? 'Copied!' : 'Copy message'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(customBody || rendered)}`,
              '_blank',
            )
          }
        >
          Open in WhatsApp
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            window.open(
              `mailto:${client.email || ''}?subject=${encodeURIComponent(
                'Quick favor?',
              )}&body=${encodeURIComponent(customBody || rendered)}`,
              '_blank',
            )
          }
        >
          Open in Email
        </Button>
        {referralLink && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => copy(referralLink, 'link')}
          >
            {copied === 'link' ? 'Link copied!' : 'Copy referral link'}
          </Button>
        )}
      </div>
    </Card>
  )
}

export function ClientDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
  })

  const generateCode = useMutation({
    mutationFn: () => ensureReferralCode(id, client.name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  const toggleEligible = useMutation({
    mutationFn: (value) => updateClient(id, { referral_eligible: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  if (isLoading) return <PageLoader label="Loading client…" />
  if (!client) return <p>Client not found.</p>

  const referralLink = client.referral_codes?.[0]
    ? `${PUBLIC_APP_URL}/r/${client.referral_codes[0].code}`
    : null

  const successfulReferrals =
    client.referrals?.filter((r) => r.stage === 'won').length || 0
  const pendingReferrals =
    client.referrals?.filter((r) => !['won', 'lost'].includes(r.stage)).length || 0

  return (
    <div className="flex flex-col gap-6">
      <Link to="/clients" className="text-sm text-[var(--color-text-muted)] hover:underline">
        ← Back to clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            {client.name}
          </h1>
          {client.company && (
            <p className="text-sm text-[var(--color-text-muted)]">{client.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={client.referral_eligible ? 'success' : 'neutral'}>
            {client.referral_eligible ? 'Referral Eligible' : 'Not Eligible'}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toggleEligible.mutate(!client.referral_eligible)}
          >
            {client.referral_eligible ? 'Mark ineligible' : 'Mark eligible'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Referrals', value: client.referrals?.length || 0 },
          { label: 'Successful', value: successfulReferrals },
          { label: 'Pending', value: pendingReferrals },
          {
            label: 'Contact',
            value: client.preferred_contact_method || '—',
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-[var(--color-text-faint)]">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Referral link
        </h2>
        {referralLink ? (
          <p className="mt-2 break-all text-sm text-[var(--color-accent-700)]">
            {referralLink}
          </p>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-text-muted)]">
              No referral code yet for this client.
            </p>
            <Button
              size="sm"
              onClick={() => generateCode.mutate()}
              disabled={generateCode.isPending}
            >
              {generateCode.isPending ? 'Generating…' : 'Generate referral link'}
            </Button>
          </div>
        )}
      </Card>

      <ReferralRequestBuilder client={client} />

      {client.notes && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
            {client.notes}
          </p>
        </Card>
      )}
    </div>
  )
}
