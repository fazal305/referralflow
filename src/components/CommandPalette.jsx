import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabaseClient'
import { Input } from './ui/Input'

async function search(term) {
  if (!term) return { clients: [], referrals: [] }

  const [clientsRes, referralsRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, company')
      .or(`name.ilike.%${term}%,company.ilike.%${term}%,notes.ilike.%${term}%`)
      .limit(5),
    supabase
      .from('referrals')
      .select('id, lead_name, referrer_name')
      .or(`lead_name.ilike.%${term}%,referrer_name.ilike.%${term}%`)
      .limit(5),
  ])

  if (clientsRes.error) throw clientsRes.error
  if (referralsRes.error) throw referralsRes.error

  return { clients: clientsRes.data, referrals: referralsRes.data }
}

export function CommandPalette({ onClose }) {
  const [term, setTerm] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', term],
    queryFn: () => search(term),
    enabled: term.length > 1,
  })

  useEffect(() => {
    inputRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function go(path) {
    navigate(path)
    onClose()
  }

  const hasResults =
    data && (data.clients.length > 0 || data.referrals.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Global search"
      >
        <Input
          ref={inputRef}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search clients, referrals…"
          aria-label="Search"
        />

        <div className="mt-2 max-h-80 overflow-y-auto">
          {term.length > 1 && isFetching && (
            <p className="px-2 py-3 text-sm text-[var(--color-text-muted)]">
              Searching…
            </p>
          )}

          {term.length > 1 && !isFetching && !hasResults && (
            <p className="px-2 py-3 text-sm text-[var(--color-text-muted)]">
              No matches for "{term}".
            </p>
          )}

          {data?.clients?.length > 0 && (
            <div className="mb-2">
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                Clients
              </p>
              {data.clients.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(`/clients/${c.id}`)}
                  className="flex w-full items-center rounded-[var(--radius-md)] px-2 py-2 text-left text-sm hover:bg-black/5"
                >
                  {c.name}
                  {c.company && (
                    <span className="ml-2 text-[var(--color-text-faint)]">
                      {c.company}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {data?.referrals?.length > 0 && (
            <div>
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                Referrals
              </p>
              {data.referrals.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => go(`/referrals/${r.id}`)}
                  className="flex w-full items-center rounded-[var(--radius-md)] px-2 py-2 text-left text-sm hover:bg-black/5"
                >
                  {r.lead_name}
                  {r.referrer_name && (
                    <span className="ml-2 text-[var(--color-text-faint)]">
                      via {r.referrer_name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
