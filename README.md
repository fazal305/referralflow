# ReferralFlow

A referral management workspace for **Fazal Abbas** — built to intentionally generate,
request, track, and convert client referrals, instead of leaving word-of-mouth growth
to chance.

**Live**: https://referralflow-rust.vercel.app
**Repo**: https://github.com/fazal305/referralflow (private)

## Demo login

```
Email:    admin@referralflow.local
Password: 6kCsncfql8Hk
```

This is a real, working credential set generated for initial setup — not a placeholder.
Change it any time by updating `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` in Vercel's
environment variables (see **Changing your login** below). No code change needed.

## What it does

- **Clients** — track relationship status, referral eligibility, and referral history per client.
- **Win Moment** — configure when a referral request should be suggested after a project wraps (immediately, 24h/48h/7d later, or manual).
- **Referral Request Builder** — generate an editable, ready-to-forward message per client, with one-click copy, WhatsApp, and email actions.
- **Referral links** — every client can get a unique code (`/r/CODE`); the public page identifies the referrer and collects the lead with a short, mobile-first form.
- **Referral Pipeline** — New → Contacted → Qualified → Proposal Sent → Negotiating → Won/Lost, filterable and searchable, with attribution preserved back to the referring client at every stage.
- **Templates** — editable message templates per stage (`referral_request`, `thank_you`, `deal_won`, etc.) with safe `{{variable}}` substitution — unknown variables are left untouched rather than breaking the message.
- **Rewards** — a fully configurable incentive system (percentage, fixed, discount, gift, custom, or **no incentive at all** — the default, per your choice).
- **Close the loop** — an activity timeline per referral and a "Thank the referrer" composer so the person who referred someone is never left wondering what happened.
- **Dashboard** — total/pending/qualified/won referrals, conversion rate, pipeline value, revenue from referrals, referrals-over-time and pipeline-by-stage charts.
- **Global search** (Ctrl/Cmd+K) across clients and referrals.

## Tech stack

- **Frontend**: React 19 + Vite + JavaScript, React Router, TanStack Query, Zustand, Tailwind CSS v4, Recharts
- **Backend**: Vercel Serverless Functions (Node) under `/api`, talking to Neon Postgres
- **Auth**: single admin user via env vars + a signed httpOnly session cookie (no `users` table, no third-party auth service)
- **Deployment**: Vercel (frontend + API) + Neon (hosted Postgres)

### Why this architecture?

Originally built on Supabase (Postgres + Auth + RLS), migrated to Neon + Vercel Functions
after hitting Supabase's 2-project free-tier cap. Neon is Postgres-only — no built-in
REST API, auth, or row-level security enforcement — so the `/api` functions are now the
only thing that talks to the database, and authorization is enforced in each function by
checking the session cookie instead of in Postgres RLS policies. The public referral
submission path (`/api/public/submit-referral`) mirrors the old security-definer function:
it validates the referral code, rate-limits (5 submissions per code per 10 minutes), and
inserts only into `referrals` — it can never read client data.

Vercel's Hobby plan caps a deployment at 12 serverless functions, so each resource
(clients, referrals, templates, rewards, tasks, auth, public) is one function file that
dispatches on the sub-path (forwarded via a `vercel.json` rewrite as a `?match=` query
param) rather than one file per route — 10 functions total.

## Project structure

```
api/
  _lib/db.js         Neon client (tagged-template `sql` + parameterized `query` for dynamic updates)
  _lib/auth.js        session cookie sign/verify, requireAuth() wrapper
  clients.js          /api/clients, /api/clients/:id, /api/clients/:id/referral-code
  referrals.js        /api/referrals, /api/referrals/:id, /api/referrals/:id/events
  templates.js        /api/templates, /api/templates/:id
  rewards.js          /api/rewards, /api/rewards/settings
  tasks.js             /api/tasks, /api/tasks/:id/complete
  auth.js              /api/auth/login, /logout, /session
  public.js            /api/public/referrer/:code, /api/public/submit-referral (no auth)
  dashboard.js  health.js  search.js
src/
  components/         shared UI primitives (Button, Card, Input, Badge, EmptyState…) + AppShell, CommandPalette
  features/auth/       login page
  pages/               route-level screens
  services/            fetch-based API client, grouped by domain
  stores/              Zustand — auth session only
  config/              constants: pipeline stages, win-moment triggers, reward types, template variables
  styles/              design tokens (tokens.css)
db/
  schema.sql           full schema, indexes, triggers — run this against your Neon database
```

## Setup (from scratch)

1. **Install dependencies**: `npm install`
2. **Create a Neon project** at [neon.tech](https://neon.tech) and copy its connection string.
3. **Run the schema**: paste `db/schema.sql` into the Neon SQL editor and run it.
4. **Configure environment variables** — copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — the Neon connection string
   - `SESSION_SECRET` — any long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `ADMIN_EMAIL` — the email you want to log in with
   - `ADMIN_PASSWORD_HASH` — a bcrypt hash of your password (`node -e "require('bcryptjs').hash('yourpassword', 10).then(console.log)"`)
   - `VITE_PUBLIC_APP_URL` — your production domain, once you have one (used to build `/r/CODE` links; falls back to the current origin if left blank)
5. **Run it locally**: `npm run dev` runs the Vite frontend only (no `/api` functions). To exercise the full stack locally, use the Vercel CLI: `vercel dev --listen 5221` (after `vercel link`ing the project).

## Changing your login

The admin email/password live only in environment variables — never in code or the database.
To change them:
1. Generate a new bcrypt hash: `node -e "require('bcryptjs').hash('your-new-password', 10).then(console.log)"`
2. Update `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` in Vercel → Project Settings → Environment Variables (and in `.env.local` for local dev).
3. Redeploy (`vercel deploy --prod`) for the new credentials to take effect.

## Deployment

- **Frontend + API**: both deployed together to Vercel from this repo. `vercel.json` routes `/api/<resource>/<sub-path>` to the matching function (forwarding the sub-path as `?match=`), then falls through to filesystem resolution, then rewrites everything else to `index.html` for client-side routing — verified working on nested routes (`/clients/:id`) and the public referral route (`/r/:code`) in production.
- **Database**: Neon is a hosted service — once the schema is applied, it's "deployed." No separate backend deployment step.
- **Required environment variables in Vercel** (Production, Preview, and Development): `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, and `VITE_PUBLIC_APP_URL` once you have a domain.

## Security notes

- The admin password is never stored in plain text — only its bcrypt hash, as an env var.
- Sessions are signed JWTs (HS256) in an httpOnly, SameSite=Lax cookie (Secure in production) — never readable or forgeable from client-side JS.
- Every non-public `/api` function is wrapped in `requireAuth()`, which 401s without a valid session cookie.
- The public referral form only ever reaches `/api/public/*`: `referrer/:code` returns just the referring client's name (nothing else), and `submit-referral` validates the code, rate-limits, and inserts only lead-facing fields — it has no read access to client data at all.
- No API keys or secrets are in the frontend bundle — all sensitive values live server-side in `/api` functions, which run only on Vercel's infrastructure.
- `.env` / `.env.local` are gitignored; verified nothing sensitive is committed.

## Known limitations / future improvements

- No external email/SMS sending API is integrated — "send" actions currently open WhatsApp/mailto or copy to clipboard. Adding a transactional email provider (e.g. Resend) is a natural next step if automated sending becomes necessary.
- No automation engine yet (e.g. auto-creating a referral request task when a project's Win Moment trigger fires) — the Win Moment trigger is configurable in Settings but firing it is currently manual. This is the top candidate for a v2 automation pass.
- Recharts adds meaningful bundle weight (~200kB gzipped total); code-splitting the dashboard chart bundle is a reasonable follow-up if load time becomes a concern.
- Demo/seed data was intentionally not added — the app ships empty, per project decision. (A UI smoke test was run against production during development and fully cleaned up afterward — the database is empty and ready for real data.)
- Single admin user by design — there's no multi-user/role system, matching the "just me logging in" requirement.
