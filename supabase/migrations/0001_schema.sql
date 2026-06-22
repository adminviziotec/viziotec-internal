-- =============================================================
-- VIMS — Viziotec Internal Management System
-- 0001_schema.sql : types, tables, functions, triggers
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role        as enum ('owner', 'co_owner', 'team_member');
create type invoice_status   as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type project_status   as enum ('lead', 'proposal_sent', 'negotiation', 'ongoing', 'existing', 'finished', 'cancelled');
create type project_priority as enum ('low', 'medium', 'high', 'urgent');
create type service_type     as enum (
  'website_design', 'application_development', 'branding', 'digital_marketing',
  'seo', 'social_media_management', 'advertising', 'other'
);
create type transaction_type as enum ('income', 'expense');
create type event_type       as enum ('meeting', 'project_deadline', 'internal_agenda', 'personal_reminder');
create type note_color       as enum ('yellow', 'blue', 'pink', 'green', 'purple');
create type notification_type as enum (
  'invoice_due', 'project_deadline', 'agenda_reminder', 'project_assigned', 'project_update'
);

-- ---------- USERS (profile mirror of auth.users) ----------
create table public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  email         text not null unique,
  role          user_role not null default 'team_member',
  profile_image text,
  position      text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- INVOICES ----------
create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  client_name    text not null,
  client_email   text,
  client_phone   text,
  project_id     uuid, -- FK added after projects table is created
  project_name   text,
  invoice_date   date not null default current_date,
  due_date       date,
  subtotal       numeric(14,2) not null default 0,
  tax_percentage numeric(5,2)  not null default 0,
  tax_amount     numeric(14,2) not null default 0,
  discount       numeric(14,2) not null default 0,
  grand_total    numeric(14,2) not null default 0,
  status         invoice_status not null default 'draft',
  notes          text,
  pdf_url        text,
  created_by     uuid references public.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.invoice_items (
  id           uuid primary key default gen_random_uuid(),
  invoice_id   uuid not null references public.invoices (id) on delete cascade,
  service_name text not null,
  description  text,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  total_price  numeric(14,2) not null default 0,
  sort_order   int not null default 0
);

-- ---------- PROJECTS ----------
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  project_name    text not null,
  client_name     text,
  description     text,
  service_type    service_type not null default 'other',
  project_manager uuid references public.users (id) on delete set null,
  assigned_to     uuid[] not null default '{}',
  status          project_status not null default 'lead',
  priority        project_priority not null default 'medium',
  progress        int not null default 0 check (progress between 0 and 100),
  start_date      date,
  deadline        date,
  budget          numeric(14,2),
  notes           text,
  created_by      uuid references public.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.invoices
  add constraint invoices_project_fk
  foreign key (project_id) references public.projects (id) on delete set null;

create table public.project_activity (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid references public.users (id) on delete set null,
  activity   text not null,
  created_at timestamptz not null default now()
);

-- ---------- FINANCE ----------
create table public.finance_transactions (
  id               uuid primary key default gen_random_uuid(),
  type             transaction_type not null,
  category         text not null,
  title            text not null,
  description      text,
  amount           numeric(14,2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  receipt_url      text,
  project_id       uuid references public.projects (id) on delete set null,
  created_by       uuid references public.users (id) on delete set null,
  created_at       timestamptz not null default now()
);

-- ---------- CALENDAR ----------
create table public.calendar_events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  event_type     event_type not null default 'meeting',
  start_datetime timestamptz not null,
  end_datetime   timestamptz,
  all_day        boolean not null default false,
  created_by     uuid references public.users (id) on delete set null,
  assigned_to    uuid[] not null default '{}',
  reminder       int, -- minutes before start
  created_at     timestamptz not null default now()
);

-- ---------- NOTES (private per user) ----------
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  title       text not null default '',
  content     text not null default '',
  color       note_color not null default 'yellow',
  position_x  int not null default 0,
  position_y  int not null default 0,
  is_pinned   boolean not null default false,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- NOTIFICATIONS ----------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- ACTIVITY LOGS ----------
create table public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users (id) on delete set null,
  action     text not null,
  module     text not null,
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index idx_invoices_status      on public.invoices (status);
create index idx_invoices_client      on public.invoices (client_name);
create index idx_invoices_date        on public.invoices (invoice_date);
create index idx_invoice_items_inv    on public.invoice_items (invoice_id);
create index idx_projects_status      on public.projects (status);
create index idx_projects_manager     on public.projects (project_manager);
create index idx_projects_assigned    on public.projects using gin (assigned_to);
create index idx_project_activity_pid on public.project_activity (project_id);
create index idx_finance_type         on public.finance_transactions (type);
create index idx_finance_date         on public.finance_transactions (transaction_date);
create index idx_events_start         on public.calendar_events (start_datetime);
create index idx_notes_user           on public.notes (user_id);
create index idx_notifications_user   on public.notifications (user_id, is_read);
create index idx_logs_created         on public.activity_logs (created_at desc);

-- =============================================================
-- Functions & Triggers
-- =============================================================

-- Generic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated    before update on public.users    for each row execute function public.set_updated_at();
create trigger trg_invoices_updated before update on public.invoices for each row execute function public.set_updated_at();
create trigger trg_projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_notes_updated    before update on public.notes    for each row execute function public.set_updated_at();

-- Mirror new auth users into public.users.
-- The very first user to sign up becomes the owner; everyone else a team member.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  resolved_role user_role;
begin
  select count(*) = 0 into is_first from public.users;
  resolved_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    case when is_first then 'owner'::user_role else 'team_member'::user_role end
  );
  insert into public.users (id, email, full_name, role, position)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    resolved_role,
    new.raw_user_meta_data->>'position'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers (SECURITY DEFINER -> bypass RLS, avoids recursive policies)
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_owner_or_coowner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() in ('owner', 'co_owner'), false);
$$;

-- Sequential invoice number per year, format VZT-INV-YYYY-0001
create or replace function public.next_invoice_number()
returns text language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  select coalesce(max((regexp_replace(invoice_number, '^VZT-INV-\d{4}-', ''))::int), 0) + 1
    into seq
  from public.invoices
  where invoice_number like 'VZT-INV-' || yr || '-%';
  return 'VZT-INV-' || yr || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- Auto-mark overdue invoices when read (lightweight; real cron can also do this)
create or replace function public.invoice_is_overdue(inv public.invoices)
returns boolean language sql immutable as $$
  select inv.status = 'sent' and inv.due_date is not null and inv.due_date < current_date;
$$;

-- =============================================================
-- Company cash — derived, never edited by hand
-- =============================================================
create or replace view public.company_cash as
select
  coalesce(sum(amount) filter (where type = 'income'), 0)  as total_income,
  coalesce(sum(amount) filter (where type = 'expense'), 0) as total_expense,
  coalesce(sum(amount) filter (where type = 'income'), 0)
    - coalesce(sum(amount) filter (where type = 'expense'), 0) as current_money
from public.finance_transactions;
