-- =============================================================
-- VIMS — 0002_policies.sql : Row Level Security
-- =============================================================

alter table public.users                enable row level security;
alter table public.invoices             enable row level security;
alter table public.invoice_items        enable row level security;
alter table public.projects             enable row level security;
alter table public.project_activity     enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.calendar_events      enable row level security;
alter table public.notes                enable row level security;
alter table public.notifications        enable row level security;
alter table public.activity_logs        enable row level security;

-- ---------- USERS ----------
-- Everyone authenticated can read profiles (names/avatars across the app).
create policy users_select on public.users
  for select to authenticated using (true);

-- A user may update their own profile fields; owners/co-owners may update anyone.
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid() or public.is_owner_or_coowner())
  with check (id = auth.uid() or public.is_owner_or_coowner());

-- Only owners/co-owners may insert profiles directly (invites also flow via trigger).
create policy users_insert on public.users
  for insert to authenticated
  with check (public.is_owner_or_coowner());

-- Owners/co-owners may delete users, but the Owner account is protected.
create policy users_delete on public.users
  for delete to authenticated
  using (public.is_owner_or_coowner() and role <> 'owner');

-- ---------- INVOICES : owner/co-owner CRUD, team read ----------
create policy invoices_select on public.invoices
  for select to authenticated using (true);
create policy invoices_write on public.invoices
  for all to authenticated
  using (public.is_owner_or_coowner())
  with check (public.is_owner_or_coowner());

create policy invoice_items_select on public.invoice_items
  for select to authenticated using (true);
create policy invoice_items_write on public.invoice_items
  for all to authenticated
  using (public.is_owner_or_coowner())
  with check (public.is_owner_or_coowner());

-- ---------- PROJECTS : everyone views; owner/co-owner manage; assignees update ----------
create policy projects_select on public.projects
  for select to authenticated using (true);

create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.is_owner_or_coowner());

create policy projects_update on public.projects
  for update to authenticated
  using (
    public.is_owner_or_coowner()
    or auth.uid() = any(assigned_to)
    or auth.uid() = project_manager
  )
  with check (
    public.is_owner_or_coowner()
    or auth.uid() = any(assigned_to)
    or auth.uid() = project_manager
  );

create policy projects_delete on public.projects
  for delete to authenticated
  using (public.is_owner_or_coowner());

-- Project activity: anyone can read; assignees/managers/owners can append.
create policy project_activity_select on public.project_activity
  for select to authenticated using (true);
create policy project_activity_insert on public.project_activity
  for insert to authenticated
  with check (
    public.is_owner_or_coowner()
    or exists (
      select 1 from public.projects p
      where p.id = project_id
        and (auth.uid() = any(p.assigned_to) or auth.uid() = p.project_manager)
    )
  );

-- ---------- FINANCE : owner/co-owner only ----------
create policy finance_all on public.finance_transactions
  for all to authenticated
  using (public.is_owner_or_coowner())
  with check (public.is_owner_or_coowner());

-- ---------- CALENDAR : all view; create own; manage own or owner/co-owner ----------
create policy events_select on public.calendar_events
  for select to authenticated using (true);
create policy events_insert on public.calendar_events
  for insert to authenticated
  with check (created_by = auth.uid());
create policy events_update on public.calendar_events
  for update to authenticated
  using (created_by = auth.uid() or public.is_owner_or_coowner())
  with check (created_by = auth.uid() or public.is_owner_or_coowner());
create policy events_delete on public.calendar_events
  for delete to authenticated
  using (created_by = auth.uid() or public.is_owner_or_coowner());

-- ---------- NOTES : strictly private to the owner ----------
create policy notes_all on public.notes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- NOTIFICATIONS : own only ----------
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_insert on public.notifications
  for insert to authenticated with check (true);
create policy notifications_delete on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ---------- ACTIVITY LOGS : insert by anyone; owner/co-owner read all, others read own ----------
create policy logs_insert on public.activity_logs
  for insert to authenticated with check (true);
create policy logs_select on public.activity_logs
  for select to authenticated
  using (public.is_owner_or_coowner() or user_id = auth.uid());
