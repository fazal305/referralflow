-- ReferralFlow database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.
-- Single-user model: every row is owned by auth.uid() = owner_id, enforced via RLS.
-- The public referral form uses the `anon` role and can only INSERT into `referrals`
-- through the `submit_public_referral` function below — it never reads client data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

create index clients_owner_idx on clients(owner_id);

-- ---------------------------------------------------------------------------
-- projects (one client can have several)
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

create index projects_owner_idx on projects(owner_id);
create index projects_client_idx on projects(client_id);

-- ---------------------------------------------------------------------------
-- referral_codes — one active code per client
-- ---------------------------------------------------------------------------
create table referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  code text not null unique,
  slug text unique, -- human-friendly path segment, e.g. ahmed-traders
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index referral_codes_owner_idx on referral_codes(owner_id);
create index referral_codes_client_idx on referral_codes(client_id);

-- ---------------------------------------------------------------------------
-- referrals — the lead created from a referral
-- ---------------------------------------------------------------------------
create table referrals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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

create index referrals_owner_idx on referrals(owner_id);
create index referrals_code_idx on referrals(referral_code_id);
create index referrals_stage_idx on referrals(stage);

-- ---------------------------------------------------------------------------
-- referral_events — activity timeline, append-only
-- ---------------------------------------------------------------------------
create table referral_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null, -- referral_request|referral_received|thank_you|lead_contacted|proposal_sent|deal_won|deal_lost|follow_up
  name text not null,
  channel text not null default 'message', -- message|whatsapp|email
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index referral_templates_owner_idx on referral_templates(owner_id);

-- ---------------------------------------------------------------------------
-- referral_rewards — configurable incentive, per referral
-- ---------------------------------------------------------------------------
create table referral_rewards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid not null references referrals(id) on delete cascade,
  reward_type text not null default 'none', -- none|percentage|fixed|discount|gift|custom
  reward_value text,
  trigger text not null default 'won', -- won|qualified|manual
  status text not null default 'pending', -- pending|earned|fulfilled
  fulfilled_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index referral_rewards_owner_idx on referral_rewards(owner_id);
create index referral_rewards_referral_idx on referral_rewards(referral_id);

-- ---------------------------------------------------------------------------
-- reward_settings — the default incentive configuration
-- ---------------------------------------------------------------------------
create table reward_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  reward_type text not null default 'none',
  reward_value text,
  trigger text not null default 'won',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tasks — reminders / follow-ups
-- ---------------------------------------------------------------------------
create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  referral_id uuid references referrals(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_owner_idx on tasks(owner_id);
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table clients enable row level security;
alter table projects enable row level security;
alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table referral_events enable row level security;
alter table referral_templates enable row level security;
alter table referral_rewards enable row level security;
alter table reward_settings enable row level security;
alter table tasks enable row level security;

-- Owner-only access on every table (single-user tool: owner_id = auth.uid()).
create policy "owner full access" on clients for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on projects for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on referral_codes for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on referrals for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on referral_events for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on referral_templates for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on referral_rewards for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on reward_settings for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner full access" on tasks for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- The public referral page needs to resolve a code to a display name only —
-- never full client details. Expose the minimum via a security-definer function.
create or replace function get_referrer_display_name(p_code text)
returns table (client_name text, code_is_active boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select c.name, rc.is_active
    from referral_codes rc
    join clients c on c.id = rc.client_id
    where rc.code = p_code
    limit 1;
end;
$$;

grant execute on function get_referrer_display_name(text) to anon, authenticated;

-- The public referral submission path: anon can only call this function,
-- never write to `referrals` directly (no INSERT policy is granted to anon).
-- Basic spam guard: reject if the same code submitted >5 referrals in 10 minutes.
create or replace function submit_public_referral(
  p_code text,
  p_lead_name text,
  p_lead_email text,
  p_lead_phone text,
  p_lead_need text,
  p_referrer_name text,
  p_referrer_email text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_code_id uuid;
  v_client_id uuid;
  v_is_active boolean;
  v_recent_count int;
  v_referral_id uuid;
begin
  if length(trim(coalesce(p_lead_name, ''))) = 0 then
    raise exception 'Lead name is required';
  end if;

  select rc.id, rc.client_id, rc.owner_id, rc.is_active
    into v_code_id, v_client_id, v_owner_id, v_is_active
    from referral_codes rc
    where rc.code = p_code;

  if v_code_id is null or v_is_active is not true then
    raise exception 'This referral link is no longer active.';
  end if;

  select count(*) into v_recent_count
    from referrals
    where referral_code_id = v_code_id
      and created_at > now() - interval '10 minutes';

  if v_recent_count >= 5 then
    raise exception 'Too many submissions from this link recently. Please try again later.';
  end if;

  insert into referrals (
    owner_id, referral_code_id, referrer_client_id,
    lead_name, lead_email, lead_phone, lead_need,
    referrer_name, referrer_email, message, source
  ) values (
    v_owner_id, v_code_id, v_client_id,
    p_lead_name, p_lead_email, p_lead_phone, p_lead_need,
    p_referrer_name, p_referrer_email, p_message, 'referral_link'
  )
  returning id into v_referral_id;

  insert into referral_events (owner_id, referral_id, event_type, description)
  values (v_owner_id, v_referral_id, 'submitted', 'Referral submitted via public link');

  return v_referral_id;
end;
$$;

grant execute on function submit_public_referral(
  text, text, text, text, text, text, text, text
) to anon;
