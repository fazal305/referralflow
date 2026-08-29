# ReferralFlow

A referral management workspace for **Fazal Abbas** — built to intentionally generate,
request, track, and convert client referrals, instead of leaving word-of-mouth growth
to chance.

## What it does

- **Clients** — track relationship status, referral eligibility, and referral history per client.
- **Win Moment** — configure when a referral request should be suggested after a project wraps (immediately, 24h/48h/7d later, or manual).
- **Referral Request Builder** — generate an editable, ready-to-forward message per client, with one-click copy, WhatsApp, and email actions.
- **Referral links** — every client can get a unique code (`/r/CODE`); the public page identifies the referrer and collects the lead with a short, mobile-first form.
- **Referral Pipeline** — New → Contacted → Qualified → Proposal Sent → Negotiating → Won/Lost, filterable and searchable, with attribution preserved back to the referring client at every stage.
- **Templates** — editable message templates per stage (`referral_request`, `thank_you`, `deal_won`, etc.) with safe `{{variable}}` substitution — unknown variables are left untouched rather than breaking the message.
- **Rewards** — a fully configurable incentive system (percentage, fixed, discount, gift, custom, or **no incentive at all** — the default).
- **Close the loop** — an activity timeline per referral and a "Thank the referrer" composer so the person who referred someone is never left wondering what happened.
- **Dashboard** — total/pending/qualified/won referrals, conversion rate, pipeline value, revenue from referrals, referrals-over-time and pipeline-by-stage charts.
- **Global search** (Ctrl/Cmd+K) across clients and referrals.

## Tech stack

- **Frontend**: React 19 + Vite + JavaScript, React Router, TanStack Query, Zustand, Tailwind CSS v4, Recharts
- **Backend**: Supabase (Postgres + Auth + Row Level Security) — no separate API server; the frontend talks to Supabase directly, with authorization enforced at the database layer
- **Deployment**: Vercel (frontend) + Supabase (hosted database/auth)

### Why no custom backend?

This is a single-user tool. Postgres Row Level Security policies (`owner_id = auth.uid()`)
give the same authorization guarantees a hand-rolled API would, with far less code to
maintain. The one public-facing write path — the referral submission form — goes through
a `security definer` Postgres function (`submit_public_referral`) rather than a direct
table insert, so the anonymous `anon` role can create a referral but can never read client
data, and submissions are rate-limited (5 per referral code per 10 minutes) at the database
level.

## Project structure

```
src/
  components/       shared UI primitives (Button, Card, Input, Badge, EmptyState…) + AppShell, CommandPalette
  features/
    auth/            login page
    dashboard/ clients/ referrals/ templates/ rewards/ settings/ public-referral/  (reserved for feature-local code as it grows)
  pages/             route-level screens
  services/          Supabase queries, grouped by domain (clients.js, referrals.js, templates.js, rewards.js, tasks.js, publicReferral.js)
  stores/            Zustand — auth session only
  config/            constants: pipeline stages, win-moment triggers, reward types, template variables
  styles/            design tokens (tokens.css)
supabase/
  schema.sql         full schema, indexes, triggers, and RLS policies — run this in the Supabase SQL editor
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create a Supabase project** at [supabase.com](https://supabase.com).
3. **Run the schema** — open the SQL editor in your Supabase project and run the contents of `supabase/schema.sql`.
4. **Create your user** — Authentication → Users → Add user (email + password). This app is single-user; whoever logs in owns all the data.
5. **Configure environment variables** — copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in:
   - `VITE_SUPABASE_URL` — Project Settings → API → Project URL
   - `VITE_SUPABASE_ANON_KEY` — Project Settings → API → anon public key
   - `VITE_PUBLIC_APP_URL` — your production domain, once you have one (used to build `/r/CODE` links; falls back to the current origin if left blank)
6. **Run it**
   ```bash
   npm run dev
   ```

## Deployment

- **Frontend**: deployed to Vercel. `vercel.json` rewrites all routes to `index.html` so client-side routing (including direct navigation and refresh on nested routes like `/clients/:id`) works correctly in production.
- **Backend**: Supabase is a hosted service — there's no separate backend deployment step. Once your Supabase project exists and the schema is applied, it's "deployed."
- **Required environment variables in Vercel**: set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (once you have a domain) `VITE_PUBLIC_APP_URL` in the Vercel project settings — the same values as `.env.local`.

## Security notes

- Every table has Row Level Security enabled; only the authenticated owner (`auth.uid()`) can read or write client/referral/template/reward data.
- The public referral form never touches client tables directly — it calls `submit_public_referral()`, a security-definer function that validates the code, enforces a submission rate limit, and inserts only into `referrals`.
- The public page shows only the referring client's name (via `get_referrer_display_name()`) — never email, phone, notes, or any other private field.
- No API keys are hardcoded — all Supabase config comes from environment variables, and `.env` / `.env.local` are gitignored.

## Known limitations / future improvements

- No external email/SMS sending API is integrated — "send" actions currently open WhatsApp/mailto or copy to clipboard. Adding a transactional email provider (e.g. Resend) is a natural next step if automated sending becomes necessary.
- No automation engine yet (e.g. auto-creating a referral request task when a project's Win Moment trigger fires) — the Win Moment trigger is configurable in Settings but firing it is currently manual. This is the top candidate for a v2 automation pass.
- Recharts adds meaningful bundle weight (~180kB gzipped total); code-splitting the dashboard chart bundle is a reasonable follow-up if load time becomes a concern.
- Demo/seed data was intentionally not added — the app ships empty, per project decision.
