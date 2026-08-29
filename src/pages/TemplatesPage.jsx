import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../services/templates'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { TEMPLATE_CATEGORIES, TEMPLATE_VARIABLES } from '../config/constants'

const CATEGORY_LABELS = {
  referral_request: 'Referral Request',
  referral_received: 'Referral Received',
  thank_you: 'Thank You',
  lead_contacted: 'Lead Contacted',
  proposal_sent: 'Proposal Sent',
  deal_won: 'Deal Won',
  deal_lost: 'Deal Lost',
  follow_up: 'Follow-up',
}

function TemplateEditor({ template, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(
    template || {
      category: 'referral_request',
      name: '',
      channel: 'message',
      body: '',
    },
  )
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: () =>
      template ? updateTemplate(template.id, form) : createTemplate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
      role="presentation"
    >
      <Card
        className="w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Edit template"
      >
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          {template ? 'Edit template' : 'New template'}
        </h2>

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <Label htmlFor="tpl-name">Name</Label>
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tpl-category">Category</Label>
              <Select
                id="tpl-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {TEMPLATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="tpl-channel">Channel</Label>
              <Select
                id="tpl-channel"
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                <option value="message">Generic message</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="tpl-body">Body</Label>
            <Textarea
              id="tpl-body"
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--color-text-faint)]">
              Variables: {TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(', ')}
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-[var(--color-danger-600)]">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim() || !form.body.trim()) {
                  setError('Name and body are required.')
                  return
                }
                setError(null)
                mutation.mutate()
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Save template'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function TemplatesPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: listTemplates,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  if (isLoading) return <PageLoader label="Loading templates…" />

  const grouped = TEMPLATE_CATEGORIES.map((category) => ({
    category,
    items: templates?.filter((t) => t.category === category) || [],
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Templates
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Editable message templates for every stage of the referral flow.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>New template</Button>
      </div>

      {templates?.length ? (
        <div className="flex flex-col gap-6">
          {grouped
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.category}>
                <h2 className="mb-2 text-sm font-semibold text-[var(--color-text)]">
                  {CATEGORY_LABELS[g.category]}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.items.map((t) => (
                    <Card key={t.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-[var(--color-text)]">
                          {t.name}
                        </p>
                        <span className="text-xs text-[var(--color-text-faint)]">
                          {t.channel}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-[var(--color-text-muted)]">
                        {t.body}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(t.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState
          title="No templates yet."
          description="Create reusable templates for referral requests, thank-yous, and follow-ups so you're never starting from a blank page."
          action={<Button onClick={() => setCreating(true)}>New template</Button>}
        />
      )}

      {(editing || creating) && (
        <TemplateEditor
          template={editing}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}
