# supabase

## Purpose
Define Supabase implementation patterns for auth, data access, and security.

## Client Boundaries
- `lib/supabase/client.ts` for browser usage.
- `lib/supabase/server.ts` for server components/actions/routes.
- `lib/supabase/admin.ts` for service-role operations only.

## Data + Security Rules
- Use migrations in `supabase/migrations`.
- Prefer soft deletes with `deleted_at` for user-facing entities.
- Add indexes for common dashboard filters and ordering.
- Keep service-role guarded and never exposed to client bundles.

## Commands
- `pnpm db:migrate`
- `pnpm db:seed`
