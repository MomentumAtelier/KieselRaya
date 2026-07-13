-- ============================================================================
-- Momentum Atelier CRM — Supabase setup
-- Run this entire file once in the Supabase SQL editor (or via `supabase db
-- push` / psql) on a fresh project. It is safe to re-run: every statement is
-- guarded with IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper: keep updated_at current
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Helper: stamp owner_id with the creating user on insert
-- ----------------------------------------------------------------------------
create or replace function public.set_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is null then
    new.owner_id = auth.uid();
  end if;
  return new;
end;
$$;

-- ============================================================================
-- companies
-- ============================================================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  industry text,
  website text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  country text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_companies_owner on public.companies;
create trigger trg_companies_owner
  before insert on public.companies
  for each row execute function public.set_owner_id();

-- ============================================================================
-- contacts
-- ============================================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contacts_owner on public.contacts;
create trigger trg_contacts_owner
  before insert on public.contacts
  for each row execute function public.set_owner_id();

-- ============================================================================
-- opportunities  (sales pipeline)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'opportunity_stage') then
    create type public.opportunity_stage as enum (
      'lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
    );
  end if;
end$$;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  stage public.opportunity_stage not null default 'lead',
  value numeric(14, 2) default 0,
  probability int default 10 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_opportunities_updated_at on public.opportunities;
create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

drop trigger if exists trg_opportunities_owner on public.opportunities;
create trigger trg_opportunities_owner
  before insert on public.opportunities
  for each row execute function public.set_owner_id();

-- ============================================================================
-- activities  (calls, emails, meetings, notes — linked to any record)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_type') then
    create type public.activity_type as enum ('call', 'email', 'meeting', 'note');
  end if;
  if not exists (select 1 from pg_type where typname = 'related_entity') then
    create type public.related_entity as enum ('company', 'contact', 'opportunity', 'conference', 'none');
  end if;
end$$;

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type public.activity_type not null default 'note',
  subject text not null,
  description text,
  related_to_type public.related_entity not null default 'none',
  related_to_id uuid,
  activity_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_activities_updated_at on public.activities;
create trigger trg_activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

drop trigger if exists trg_activities_owner on public.activities;
create trigger trg_activities_owner
  before insert on public.activities
  for each row execute function public.set_owner_id();

-- ============================================================================
-- tasks  (follow-ups)
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type public.task_status as enum ('pending', 'in_progress', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type public.task_priority as enum ('low', 'medium', 'high');
  end if;
end$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status public.task_status not null default 'pending',
  priority public.task_priority not null default 'medium',
  related_to_type public.related_entity not null default 'none',
  related_to_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_owner on public.tasks;
create trigger trg_tasks_owner
  before insert on public.tasks
  for each row execute function public.set_owner_id();

-- ============================================================================
-- conferences
-- ============================================================================
create table if not exists public.conferences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  location text,
  start_date date,
  end_date date,
  website text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_conferences_updated_at on public.conferences;
create trigger trg_conferences_updated_at
  before update on public.conferences
  for each row execute function public.set_updated_at();

drop trigger if exists trg_conferences_owner on public.conferences;
create trigger trg_conferences_owner
  before insert on public.conferences
  for each row execute function public.set_owner_id();

-- ============================================================================
-- Indexes
-- ============================================================================
create index if not exists idx_contacts_company_id on public.contacts (company_id);
create index if not exists idx_opportunities_company_id on public.opportunities (company_id);
create index if not exists idx_opportunities_contact_id on public.opportunities (contact_id);
create index if not exists idx_opportunities_stage on public.opportunities (stage);
create index if not exists idx_activities_related on public.activities (related_to_type, related_to_id);
create index if not exists idx_tasks_related on public.tasks (related_to_type, related_to_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_due_date on public.tasks (due_date);

-- ============================================================================
-- Row Level Security — every user only sees / edits rows they own
-- ============================================================================
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.conferences enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'opportunities', 'activities', 'tasks', 'conferences']
  loop
    execute format('drop policy if exists "select_own_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "insert_own_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "update_own_%1$s" on public.%1$I', t);
    execute format('drop policy if exists "delete_own_%1$s" on public.%1$I', t);

    execute format(
      'create policy "select_own_%1$s" on public.%1$I for select using (owner_id = auth.uid())', t
    );
    execute format(
      'create policy "insert_own_%1$s" on public.%1$I for insert with check (owner_id = auth.uid())', t
    );
    execute format(
      'create policy "update_own_%1$s" on public.%1$I for update using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t
    );
    execute format(
      'create policy "delete_own_%1$s" on public.%1$I for delete using (owner_id = auth.uid())', t
    );
  end loop;
end$$;

-- ============================================================================
-- Relationship-profile fields (Momentum Atelier redesign)
-- Purely additive — existing rows simply get NULL for these columns.
-- Safe to re-run.
-- ============================================================================
alter table public.companies add column if not exists revenue numeric(14, 2);
alter table public.companies add column if not exists linkedin_url text;

alter table public.contacts add column if not exists photo_url text;
alter table public.contacts add column if not exists linkedin_url text;
alter table public.contacts add column if not exists assistant_name text;
alter table public.contacts add column if not exists birthday date;
alter table public.contacts add column if not exists personal_notes text;
alter table public.contacts add column if not exists family_notes text;
alter table public.contacts add column if not exists interests text;
alter table public.contacts add column if not exists communication_preference text;

-- ============================================================================
-- Pipeline profile fields + expanded activity types (Phase 2)
-- Purely additive — existing rows simply get NULL for the new columns, and
-- existing activity rows keep their current type unchanged.
-- ============================================================================
alter table public.opportunities add column if not exists next_step text;
alter table public.opportunities add column if not exists competitors text;
alter table public.opportunities add column if not exists products text;

alter type public.activity_type add value if not exists 'text';
alter type public.activity_type add value if not exists 'linkedin';
alter type public.activity_type add value if not exists 'introduction';
alter type public.activity_type add value if not exists 'networking';

-- ============================================================================
-- Done. Next step: create a user in Authentication -> Users (or let people
-- sign up from the app's login screen), then sign in.
-- ============================================================================
