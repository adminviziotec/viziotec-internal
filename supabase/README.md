# VIMS — Supabase setup

## 1. Create a project
Go to https://supabase.com → **New project**. Note the project URL and the
`anon` public key (Project Settings → API).

## 2. Apply the schema
Open the **SQL Editor** in the Supabase dashboard and run the migration files in
order:

1. `migrations/0001_schema.sql` — tables, enums, functions, triggers, views
2. `migrations/0002_policies.sql` — Row Level Security policies
3. `migrations/0003_storage.sql` — storage buckets + policies

(Or, with the Supabase CLI: `supabase db push`.)

## 3. Create the first user → becomes Owner
The `handle_new_user` trigger gives the **first** account that signs up the
`owner` role automatically; every later sign-up defaults to `team_member`.
Sign up once through the app's login screen (or Authentication → Users in the
dashboard) to bootstrap the Owner account.

## 4. Wire up the frontend
Copy `.env.example` → `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Then `npm run dev`.

## 5. Deploy the invite-user function (for in-app invites)
The **Team → Invite user** feature calls an Edge Function that holds the
service-role key server-side (never in the browser). Deploy it with the
Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase functions deploy invite-user
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided
to the function automatically by the Supabase runtime — no extra secrets needed.

Invited users receive an email link that lands on `/reset-password`, where they
set their password. Their role is whatever the inviter chose (the DB trigger
honours the role passed in the invite metadata).

## Roles
- **owner** — full access; account cannot be deleted by others
- **co_owner** — same as owner but cannot delete the owner
- **team_member** — view invoices/projects, manage assigned projects, personal
  calendar events & private notes

## Notes on access
- Finance is restricted to owner/co-owner at the database level (RLS).
- Notes are strictly private — only the author can read/write them.
- Company cash is a derived `company_cash` view (income − expense), never edited.
