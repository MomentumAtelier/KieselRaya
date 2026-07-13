# Momentum Atelier CRM

A full CRM for Momentum Atelier: companies, contacts, opportunities, a
drag-and-drop sales pipeline, activities, follow-up tasks, conferences, and
reports — built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and
Supabase.

## 1. Create the Supabase project

1. Create a project at https://supabase.com.
2. Open the SQL editor and run the entire contents of `supabase/setup.sql`.
   This creates every table, enum, index, trigger, and row-level-security
   policy the app needs. It's safe to re-run.
3. In **Authentication → Providers**, email/password sign-in is enabled by
   default — that's all this app uses. You can turn off "Confirm email" in
   **Authentication → Settings** if you want new accounts to be usable
   immediately.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your project's values from
**Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

Never commit `.env.local` — it's already listed in `.gitignore`.

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000, choose **Create account**, sign up with an email
and password, then sign in. Every record you create is scoped to your user
via row-level security, so each teammate who signs up gets their own private
workspace unless you adjust the RLS policies.

## 4. Build for production

```bash
npm run build
npm start
```

## Project structure

- `src/app/(app)/*` — the authenticated app: dashboard, companies, contacts,
  opportunities, pipeline (kanban), activities, tasks, conferences, reports.
- `src/app/login` — sign in / sign up.
- `src/components/crud` — a generic `DataTable` + `RecordModal` pair that
  every list page (companies, contacts, opportunities, activities, tasks,
  conferences) is built from, so add/edit/search/delete behave consistently.
- `src/components/opportunities` — the drag-and-drop Kanban board.
- `src/lib/supabase` — browser, server, and middleware Supabase clients.
- `supabase/setup.sql` — the full schema, indexes, triggers, and RLS
  policies.

## Notes

- This project was assembled in an offline environment without network
  access, so `npm install` / `npm run build` could not be executed here to
  confirm a clean compile. Every import path, file, and prop shape was
  hand-checked, but if `npm run build` surfaces anything on your machine,
  paste the error back and it can be fixed directly.
- Search is server-side (via Supabase `ilike`/`or` filters), so it works
  correctly even with large tables.
- The Kanban board hides "Lost" opportunities to keep the board focused;
  manage lost deals from the Opportunities list view.
