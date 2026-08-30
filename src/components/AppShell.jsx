import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'
import { useAuthStore } from '../stores/authStore'
import { APP_NAME } from '../config/constants'
import { CommandPalette } from './CommandPalette'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/referrals', label: 'Referrals' },
  { to: '/templates', label: 'Templates' },
  { to: '/rewards', label: 'Rewards' },
  { to: '/settings', label: 'Settings' },
]

function NavLinks({ onNavigate }) {
  return (
    <nav className="mt-8 flex flex-col gap-1" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)]'
                : 'text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text)]',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const signOut = useAuthStore((s) => s.signOut)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-[var(--color-accent-500)] focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6 md:flex">
        <span className="px-2 text-base font-semibold tracking-tight text-[var(--color-text)]">
          {APP_NAME}
        </span>
        <NavLinks />
        <button
          type="button"
          onClick={signOut}
          className="mt-auto rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium text-[var(--color-text-muted)] hover:bg-black/5"
        >
          Sign out
        </button>
      </aside>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-[var(--color-surface)] px-4 py-6 shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between">
              <span className="px-2 text-base font-semibold tracking-tight text-[var(--color-text)]">
                {APP_NAME}
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="rounded-[var(--radius-md)] p-2 text-[var(--color-text-muted)] hover:bg-black/5"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
            <button
              type="button"
              onClick={signOut}
              className="mt-auto rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium text-[var(--color-text-muted)] hover:bg-black/5"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text)] hover:bg-black/5 md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-xs items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-3 text-sm text-[var(--color-text-faint)] hover:border-[var(--color-border-strong)]"
          >
            <span className="truncate">Search clients, referrals, codes…</span>
            <kbd className="ml-auto hidden shrink-0 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-faint)] sm:inline">
              Ctrl K
            </kbd>
          </button>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  )
}
