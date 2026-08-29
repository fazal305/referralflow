import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listClients, createClient } from '../services/clients'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input, Label, Select, Textarea } from '../components/ui/Input'
import { PageLoader } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'

function NewClientForm({ onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    preferred_contact_method: 'email',
    notes: '',
  })
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      onClose()
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Client name is required.')
      return
    }
    setError(null)
    mutation.mutate(form)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
      role="presentation"
    >
      <Card
        className="w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add client"
      >
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Add client
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-method">Preferred contact method</Label>
            <Select
              id="contact-method"
              value={form.preferred_contact_method}
              onChange={(e) =>
                setForm({ ...form, preferred_contact_method: e.target.value })
              }
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Add client'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => listClients({ search }),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Clients
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Manage clients and their referral eligibility.
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>Add client</Button>
      </div>

      <Input
        placeholder="Search by name or company…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
        aria-label="Search clients"
      />

      {isLoading ? (
        <PageLoader />
      ) : clients?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
              <Link key={client.id} to={`/clients/${client.id}`}>
                <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[var(--color-text)]">
                        {client.name}
                      </p>
                      {client.company && (
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {client.company}
                        </p>
                      )}
                    </div>
                    <Badge tone={client.referral_eligible ? 'success' : 'neutral'}>
                      {client.referral_eligible ? 'Eligible' : 'Not eligible'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs text-[var(--color-text-faint)]">
                    {client.projects?.length || 0} project(s)
                  </p>
                </Card>
              </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? 'No clients match your search.' : 'No clients yet.'}
          description={
            search
              ? 'Try a different name or company.'
              : 'Add your first client to start generating referrals from their success.'
          }
          action={
            !search && <Button onClick={() => setShowNew(true)}>Add client</Button>
          }
        />
      )}

      {showNew && <NewClientForm onClose={() => setShowNew(false)} />}
    </div>
  )
}
