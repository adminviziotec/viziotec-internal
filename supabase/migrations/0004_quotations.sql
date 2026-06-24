-- =============================================================
-- VIMS — 0004_quotations.sql : Quotations module
-- Mirrors invoices but with quotation statuses, a "valid_until" date,
-- and its own VZT-QUO-YYYY-#### number series.
-- =============================================================

create type quotation_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');

create table public.quotations (
  id               uuid primary key default gen_random_uuid(),
  quotation_number text unique not null,
  client_name      text not null,
  client_email     text,
  client_phone     text,
  project_id       uuid references public.projects (id) on delete set null,
  project_name     text,
  quotation_date   date not null default current_date,
  valid_until      date,
  subtotal         numeric(14,2) not null default 0,
  tax_percentage   numeric(5,2)  not null default 0,
  tax_amount       numeric(14,2) not null default 0,
  discount         numeric(14,2) not null default 0,
  grand_total      numeric(14,2) not null default 0,
  status           quotation_status not null default 'draft',
  notes            text,
  pdf_url          text,
  created_by       uuid references public.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.quotation_items (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  service_name text not null,
  description  text,
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(14,2) not null default 0,
  total_price  numeric(14,2) not null default 0,
  sort_order   int not null default 0
);

create index idx_quotations_status   on public.quotations (status);
create index idx_quotations_client   on public.quotations (client_name);
create index idx_quotations_date     on public.quotations (quotation_date);
create index idx_quotation_items_qid on public.quotation_items (quotation_id);

create trigger trg_quotations_updated
  before update on public.quotations
  for each row execute function public.set_updated_at();

-- Sequential quotation number per year: VZT-QUO-YYYY-0001
create or replace function public.next_quotation_number()
returns text language plpgsql security definer set search_path = public as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  select coalesce(max((regexp_replace(quotation_number, '^VZT-QUO-\d{4}-', ''))::int), 0) + 1
    into seq
  from public.quotations
  where quotation_number like 'VZT-QUO-' || yr || '-%';
  return 'VZT-QUO-' || yr || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- RLS — same rules as invoices: owner/co-owner CRUD, everyone reads.
alter table public.quotations      enable row level security;
alter table public.quotation_items enable row level security;

create policy quotations_select on public.quotations
  for select to authenticated using (true);
create policy quotations_write on public.quotations
  for all to authenticated
  using (public.is_owner_or_coowner())
  with check (public.is_owner_or_coowner());

create policy quotation_items_select on public.quotation_items
  for select to authenticated using (true);
create policy quotation_items_write on public.quotation_items
  for all to authenticated
  using (public.is_owner_or_coowner())
  with check (public.is_owner_or_coowner());
