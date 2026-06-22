# VIMS — Viziotec Internal Management System

An internal company portal that centralizes Viziotec's daily operations:
invoices, leads & project CRM, project management, finance, team calendar,
sticky notes, plus dashboard, notifications, search and activity logs.

> Combines the spirit of Notion + Trello + QuickBooks + Google Calendar +
> Sticky Notes inside one role-based workspace.

## Tech stack
React + TypeScript + Vite · Tailwind CSS + shadcn-style UI · React Router ·
TanStack Query · Zustand · React Hook Form + Zod · Framer Motion ·
**Supabase** (Postgres, Auth, Storage, RLS).

## Getting started

```bash
npm install
cp .env.example .env       # fill in your Supabase URL + anon key
npm run dev
```

Without Supabase env vars the app renders a setup screen instead of crashing.

### Backend
See [`supabase/README.md`](supabase/README.md). In short: create a Supabase
project, run the SQL in `supabase/migrations/` (in order) via the SQL editor,
then the first user to sign up automatically becomes the **Owner**.

## Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check only (`tsc --noEmit`) |

## Roles
- **Owner** — full access; account protected from deletion
- **Co-Owner** — same as owner, cannot delete the owner
- **Team Member** — view invoices/projects, manage assigned projects, personal
  calendar events and private sticky notes

## Project structure
```
src/
  components/      shared components + ui/ primitives (shadcn-style)
  components/layout/ app shell (Sidebar, Topbar, AppLayout)
  config/          navigation config
  features/        feature modules (auth, dashboard, …)
  lib/             supabase client, query client, utils, constants, env
  pages/           route pages (auth/, dashboard, module placeholders)
  routes/          route guards
  stores/          zustand stores (auth, theme)
  types/           database types
supabase/
  migrations/      SQL schema, RLS policies, storage buckets
```

## Build status / roadmap
- [x] **Phase 1** — Auth, role system, dashboard layout, app shell, theming
- [x] **Auth+** — Self-registration & in-app Invite User flow (Edge Function + Team management)
- [x] **Phase 2** — Invoice management (list/search/filter/paginate, create/edit with live totals, PDF/print preview, status workflow)
- [x] **Phase 3** — Leads & Project CRM (drag-and-drop Kanban, table view, filters, project detail with activity timeline + progress + linked finance)
- [x] **Phase 4** — Finance module (income/expense records, receipt uploads w/ compression + signed URLs, company cash, yearly trend & category reports)
- [x] **Phase 5** — Calendar (month/week/day views, event CRUD with reminders & invitees, project deadlines auto-shown)
- [x] **Phase 6** — Sticky Notes (private draggable board, 5 colors, markdown preview, pin/archive, auto-save, search)
- [x] **Phase 7** — Project Management module (Ongoing / Almost Finished / Finished tabs, classification filter, grid + table, project manager surfaced)
- [x] **Phase 8** — Notifications (bell + unread count, generated from assignments/status/invites), activity log, global search
- [ ] Phase 9 — Testing, optimization, deployment

The database schema and RLS for **all** modules already ship in
`supabase/migrations/`, so later phases are UI work on top of a ready backend.
