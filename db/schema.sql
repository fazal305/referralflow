-- ReferralFlow database schema (Neon / plain Postgres)
-- Run this against your Neon database (SQL editor in the Neon console, or `psql "$DATABASE_URL" -f supabase/schema.sql`).
-- Single-user app: authorization is enforced in the Vercel serverless API layer
-- (a valid session cookie is required for every endpoint except the public
-- referral-submission path), not in the database. There is no `owner_id` —
-- there is exactly one tenant.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  relationship_status text not null default 'active', -- active | past | prospect
  satisfaction text, -- positive | neutral | negative
  referral_eligible boolean not null default true,
  preferred_contact_method text, -- email | phone | whatsapp
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projects (one client can have several)
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  project_type text,
  status text not null default 'in_progress', -- in_progress | completed | cancelled
  completed_at timestamptz,
  value numeric(12, 2),
  win_moment_trigger text not null default '48h', -- immediate | 24h | 48h | 7d | manual
  win_moment_fired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_idx on projects(client_id);

-- ---------------------------------------------------------------------------
-- referral_codes — one active code per client
-- ---------------------------------------------------------------------------
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  code text not null unique,
  slug text unique, -- human-friendly path segment, e.g. ahmed-traders
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index referral_codes_client_idx on referral_codes(client_id);

-- ---------------------------------------------------------------------------
-- referrals — the lead created from a referral
-- ---------------------------------------------------------------------------
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid references referral_codes(id) on delete set null,
  referrer_client_id uuid references clients(id) on delete set null,

  -- lead details, submitted publicly
  lead_name text not null,
  lead_email text,
  lead_phone text,
  lead_need text,
  referrer_name text, -- as typed on the public form, kept even if referrer_client_id is null
  referrer_email text,
  message text,

  stage text not null default 'new', -- new|contacted|qualified|proposal|negotiating|won|lost
  potential_value numeric(12, 2),
  actual_value numeric(12, 2),
  source text not null default 'referral_link', -- referral_link | manual
  next_action text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index referrals_code_idx on referrals(referral_code_id);
create index referrals_stage_idx on referrals(stage);

-- ---------------------------------------------------------------------------
-- referral_events — activity timeline, append-only
-- ---------------------------------------------------------------------------
create table referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  event_type text not null, -- submitted|stage_changed|note_added|message_sent|reward_created
  description text not null,
  created_at timestamptz not null default now()
);

create index referral_events_referral_idx on referral_events(referral_id);

-- ---------------------------------------------------------------------------
-- referral_templates
-- ---------------------------------------------------------------------------
create table referral_templates (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- referral_request|referral_received|thank_you|lead_contacted|proposal_sent|deal_won|deal_lost|follow_up
  name text not null,
  channel text not null default 'message', -- message|whatsapp|email
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- referral_rewards — configurable incentive, per referral
-- ---------------------------------------------------------------------------
create table referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  reward_type text not null default 'none', -- none|percentage|fixed|discount|gift|custom
  reward_value text,
  trigger text not null default 'won', -- won|qualified|manual
  status text not null default 'pending', -- pending|earned|fulfilled
  fulfilled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index referral_rewards_referral_idx on referral_rewards(referral_id);

-- ---------------------------------------------------------------------------
-- reward_settings — the default incentive configuration (single row)
-- ---------------------------------------------------------------------------
create table reward_settings (
  id boolean primary key default true check (id), -- enforces a single row
  reward_type text not null default 'none',
  reward_value text,
  trigger text not null default 'won',
  updated_at timestamptz not null default now()
);

insert into reward_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- tasks — reminders / follow-ups
-- ---------------------------------------------------------------------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid references referrals(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_due_idx on tasks(due_at) where is_done = false;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at before update on clients
  for each row execute function set_updated_at();
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger referrals_set_updated_at before update on referrals
  for each row execute function set_updated_at();
create trigger referral_templates_set_updated_at before update on referral_templates
  for each row execute function set_updated_at();
