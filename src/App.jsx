import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { supabaseConfigured } from './services/supabaseClient'
import { SetupRequired } from './components/SetupRequired'
import { AppShell } from './components/AppShell'
import { PageLoader } from './components/ui/Spinner'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { ReferralDetailPage } from './pages/ReferralDetailPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { RewardsPage } from './pages/RewardsPage'
import { SettingsPage } from './pages/SettingsPage'
import { PublicReferralPage } from './pages/PublicReferralPage'
import { NotFoundPage } from './pages/NotFoundPage'

function RequireAuth({ children }) {
  const status = useAuthStore((s) => s.status)
  if (status === 'loading') return <PageLoader label="Loading…" />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  const status = useAuthStore((s) => s.status)

  useEffect(() => {
    init()
  }, [init])

  return (
    <Routes>
      {/* Public route — never requires auth, never exposes private client data. */}
      <Route path="/r/:code" element={<PublicReferralPage />} />

      {!supabaseConfigured ? (
        <Route path="*" element={<SetupRequired />} />
      ) : (
        <>
          <Route
            path="/login"
            element={
              status === 'authenticated' ? <Navigate to="/" replace /> : <LoginPage />
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="referrals/:id" element={<ReferralDetailPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </>
      )}
    </Routes>
  )
}
