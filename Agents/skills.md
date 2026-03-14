# Skills Taxonomy — AI-Assisted Full-Stack Development
## Next.js (App Router) + Supabase + Vercel + TypeScript

> A modular, implementation-level reference of every skill required to build, maintain, and evolve a production web application with AI coding agents. Each skill is atomic, executable, and maps directly to a concrete code output.

---

## Table of Contents

1. [Database Skills](#1-database-skills)
2. [Backend Skills](#2-backend-skills)
3. [Frontend Skills](#3-frontend-skills)
4. [UI/UX Skills](#4-uiux-skills)
5. [DevOps Skills](#5-devops-skills)
6. [Testing Skills](#6-testing-skills)
7. [Data & Document Processing Skills](#7-data--document-processing-skills)

---

## 1. Database Skills

---

### DB-01 · Postgres Schema Design

**Description:**
Design normalized, production-ready Postgres schemas from a feature spec. Covers data types, primary/foreign key relationships, constraints, and denormalization trade-offs.

**Example usage:**
Given "multi-tenant SaaS with users, organizations, subscriptions" — generate `organizations`, `organization_members`, `users`, `subscriptions`, `plans` with FK cascades, unique constraints, and Postgres enum types.

**Inputs required:**
- Feature description or entity model (natural language or ERD)
- Existing schema (if extending)
- Multi-tenancy strategy (org-scoped vs. user-scoped)
- Expected query patterns and row volumes

**Outputs produced:**
- `CREATE TABLE` SQL with correct types, constraints, defaults
- FK declarations with cascade rules
- Postgres enum definitions
- Inline column comments
- Supabase-compatible DDL ready for a migration file

**Implementation approach:** `AI coding agent`

---

### DB-02 · Automated Migration Generation

**Description:**
Detect the diff between the desired schema state and the current deployed schema, and output a numbered Supabase migration file safe to apply.

**Example usage:**
Developer adds `stripe_customer_id text` to `users`. Agent detects the diff and generates `supabase/migrations/20260310000000_add_stripe_customer_id.sql` with the correct `ALTER TABLE` plus a down-migration comment.

**Inputs required:**
- Target schema definition (desired state)
- Current schema (via `supabase db dump` or introspection)
- Migration naming convention

**Outputs produced:**
- Numbered `.sql` file in `supabase/migrations/`
- Up migration SQL
- Down migration as a comment block
- Summary string for the PR description

**Implementation approach:** `AI coding agent` + `Supabase CLI` (`supabase db diff`)

---

### DB-03 · Supabase Schema Management

**Description:**
Apply, validate, and track migrations across local, preview, and production Supabase environments.

**Example usage:**
After a PR merges, CI runs `supabase db push` against production. On failure the pipeline halts, Slacks the team, and surfaces the failing SQL.

**Inputs required:**
- Migration files in `supabase/migrations/`
- Target environment (local / preview / production)
- Supabase project URL and service role key

**Outputs produced:**
- Applied migration confirmation log
- Entry in `supabase_migrations` history table
- Error report with failing statement if migration fails

**Implementation approach:** `Supabase CLI` + `GitHub Actions`

---

### DB-04 · Indexing & Performance Tuning

**Description:**
Analyze query patterns and add appropriate indexes to reduce query cost. Identify gaps using `EXPLAIN ANALYZE`.

**Example usage:**
Task list filtered by `user_id` + `status` is slow. Agent adds `CREATE INDEX idx_tasks_user_status ON tasks (user_id, status)` in a new migration and documents the expected improvement.

**Inputs required:**
- Slow query or `EXPLAIN ANALYZE` output
- Table schema and approximate row counts
- Query filter and sort patterns

**Outputs produced:**
- `CREATE INDEX` statements in a new migration
- Before/after estimated query cost
- Index documentation comment

**Implementation approach:** `AI coding agent` + `pg_stat_statements` (Supabase dashboard)

---

### DB-05 · Row Level Security (RLS) Policy Generation

**Description:**
Generate Supabase RLS policies enforcing data access rules at the database layer — every query is automatically scoped to what the authenticated user may access.

**Example usage:**
Users read/update only their own rows; org admins read all rows in their org; service role bypasses RLS for background jobs.

**Inputs required:**
- Access control requirements in plain English
- Table schema (ownership/tenancy columns)
- User roles and permissions matrix
- Auth context (`auth.uid()`, `auth.jwt()` claims)

**Outputs produced:**
- `CREATE POLICY` SQL for SELECT, INSERT, UPDATE, DELETE
- Policy test matrix (role × action × expected result)
- Migration file containing all policies for the table

**Implementation approach:** `AI coding agent`

---

### DB-06 · Database Seed Generation

**Description:**
Generate realistic seed data for local development and testing that respects FK constraints and produces a demo-ready state.

**Example usage:**
Seed: 3 organizations, 10 users per org, 50 tasks per user — FK-consistent, insert-ordered to avoid constraint violations, idempotent.

**Inputs required:**
- Full schema with FK relationships
- Row counts per table
- Realistic data requirements
- Required reference/lookup data

**Outputs produced:**
- `supabase/seed.sql` or TypeScript seed script
- Insert statements ordered by FK dependency
- Idempotent seed (safe to re-run)

**Implementation approach:** `AI coding agent` + `@faker-js/faker`

---

### DB-07 · Query Optimization

**Description:**
Rewrite inefficient Supabase client queries or SQL to eliminate N+1 patterns, reduce round-trips, and leverage joins, views, and CTEs.

**Example usage:**
Three sequential `.select()` calls loading user → tasks → comments replaced with a single Supabase join or a Postgres view.

**Inputs required:**
- Current query code (TypeScript or SQL)
- Performance complaint (slow, N+1)
- Schema context (table relationships, indexes)

**Outputs produced:**
- Optimized query code
- Explanation of what changed and why
- Estimated latency improvement

**Implementation approach:** `AI coding agent`

---

### DB-08 · View & RPC Function Generation

**Description:**
Create PostgreSQL views and stored functions callable via `supabase.rpc()` — encapsulating complex multi-table logic at the database layer.

**Example usage:**
`get_dashboard_stats(org_id uuid)` returns `{ total_users, active_tasks, mrr }` in one RPC call instead of three separate queries.

**Inputs required:**
- Logic or aggregation to encapsulate
- Input parameters and Postgres types
- Return shape (single row, table, JSON)

**Outputs produced:**
- `CREATE OR REPLACE FUNCTION` SQL in a migration
- TypeScript wrapper: `supabase.rpc('function_name', params)`
- Inferred return type definition

**Implementation approach:** `AI coding agent`

---

### DB-09 · TypeScript Type Generation

**Description:**
Auto-generate TypeScript types from the live Supabase schema so all queries, inserts, and responses are fully type-safe.

**Example usage:**
After any schema change, `supabase gen types typescript` regenerates `types/database.types.ts`. TypeScript immediately surfaces errors in any query referencing changed tables.

**Inputs required:**
- Connected Supabase project or local instance
- Output file path

**Outputs produced:**
- `types/database.types.ts` with `Tables`, `Enums`, `Functions` namespaces
- Automatically consumed by the typed Supabase client

**Implementation approach:** `Supabase CLI` — automated, run post-migration

---

## 2. Backend Skills

---

### BE-01 · API Route Generation

**Description:**
Generate Next.js App Router `route.ts` handlers with correct HTTP methods, auth middleware, Zod validation, typed Supabase queries, and consistent error responses.

**Example usage:**
`app/api/tasks/route.ts` — `GET` returns paginated tasks for the authenticated user; `POST` validates with Zod, inserts, returns the created row.

**Inputs required:**
- Resource name and HTTP methods
- Request/response field names and types
- Auth requirement (public vs. authenticated)
- Database table and query pattern

**Outputs produced:**
- `route.ts` with typed handlers
- Zod schema for request body
- `NextResponse.json()` with correct status codes
- Session check via Supabase server client
- 400/401/403/404/500 error handling

**Implementation approach:** `AI coding agent`

---

### BE-02 · Server Action Generation

**Description:**
Generate Next.js Server Actions for form mutations — server-side logic without a separate API route, with cache revalidation.

**Example usage:**
`app/actions/tasks.ts` → `createTask(formData)`: validates with Zod, inserts to Supabase, calls `revalidatePath('/tasks')`, returns `{ data, error }`.

**Inputs required:**
- Action name and mutation type
- Input fields and validation rules
- Supabase table to mutate
- Cache tags or paths to revalidate

**Outputs produced:**
- `'use server'` function with Zod validation
- Supabase server client (cookies-based auth)
- `revalidatePath` / `revalidateTag` call
- Typed `{ data, error }` return
- React `useActionState`-compatible signature

**Implementation approach:** `AI coding agent`

---

### BE-03 · Business Logic Scaffolding

**Description:**
Extract business logic into `lib/services/` modules — framework-agnostic, independently testable, reusable across routes and actions.

**Example usage:**
`lib/services/subscriptions.ts` exports `createSubscription`, `cancelSubscription`, `upgradeSubscription` — handling both Stripe and Supabase, isolated from HTTP concerns.

**Inputs required:**
- Business domain name
- Operations and their rules
- External services involved
- Error cases and recovery strategies

**Outputs produced:**
- Service module with typed function exports
- Domain-specific error classes
- JSDoc per function
- Pure functions with no framework dependencies

**Implementation approach:** `AI coding agent`

---

### BE-04 · Validation Schema Generation

**Description:**
Generate Zod schemas for all system boundaries — API inputs, server action payloads, environment variables, webhook bodies.

**Example usage:**
`CreateTaskSchema`: `title` (string, 1–200 chars), `due_date` (ISO date, optional), `priority` (enum), `assigned_to` (UUID, optional). Reused in API route and frontend form.

**Inputs required:**
- Field names and types
- Validation rules (length, format, required/optional)
- Business rules (cross-field, conditional)

**Outputs produced:**
- Zod schema with all rules and error messages
- `z.infer<typeof Schema>` TypeScript type
- Reusable across API + frontend form

**Implementation approach:** `AI coding agent` + `zod`

---

### BE-05 · Authentication Integration

**Description:**
Wire Supabase Auth into Next.js App Router — middleware route protection, OAuth callbacks, server client factory, client-side session state.

**Example usage:**
`middleware.ts` protects `/app/*`. `/auth/callback/route.ts` handles OAuth code exchange. `lib/supabase/server.ts` exports the cookie-based server client for all routes and actions.

**Inputs required:**
- Auth providers (email, GitHub, Google)
- Protected route patterns
- Post-login redirect URL
- Session refresh strategy

**Outputs produced:**
- `middleware.ts` with `@supabase/ssr` session check
- `app/auth/callback/route.ts`
- `lib/supabase/server.ts` + `lib/supabase/client.ts`
- Login/signup pages
- Auth provider configuration documented

**Implementation approach:** `AI coding agent` + `@supabase/ssr`

---

### BE-06 · Role-Based Access Control (RBAC)

**Description:**
Implement RBAC layered on Supabase Auth — role definitions, server-side permission guards, UI conditional rendering.

**Example usage:**
Roles: `owner`, `admin`, `member`, `viewer` in `org_members.role`. `requireRole('admin')` guard in settings server action. `usePermission('delete', 'task')` hides the delete button for viewers.

**Inputs required:**
- Role names and permissions per resource
- Where role is stored (DB column, JWT claim)
- Resources and operations to protect

**Outputs produced:**
- `lib/auth/permissions.ts` role-permission matrix
- `requirePermission(action, resource)` server guard
- `usePermission(action, resource)` client hook
- JWT custom claims setup if needed

**Implementation approach:** `AI coding agent`

---

### BE-07 · Background Job Creation

**Description:**
Create durable background jobs for work that must not block HTTP responses — emails, webhook processing, scheduled sync.

**Example usage:**
On sign-up, queue a welcome email job. On Stripe webhook, queue a subscription-update job with exponential backoff retry.

**Inputs required:**
- Job name and trigger (event, cron, webhook)
- Job logic
- Retry configuration
- Failure handling (Slack alert, dead-letter table)

**Outputs produced:**
- Inngest function definition
- Event type and trigger config
- Retry and timeout settings
- Failure handler

**Implementation approach:** `AI coding agent` + `Inngest` (free tier, Vercel-native)

---

### BE-08 · Webhook Handler Generation

**Description:**
Generate secure webhook handlers with signature verification, idempotency, and event routing.

**Example usage:**
`app/api/webhooks/stripe/route.ts`: verify Stripe signature, route `checkout.session.completed` to `handleCheckoutComplete()`, return 200 immediately, process async.

**Inputs required:**
- Provider and signature method
- Events to handle with payload shapes
- Idempotency key field
- Async processing strategy

**Outputs produced:**
- `POST` route with signature verification
- Event router (switch on event type)
- Idempotency check
- Per-event handler functions
- Env variable documentation

**Implementation approach:** `AI coding agent`

---

### BE-09 · Third-Party API Integration

**Description:**
Generate typed integration modules for external services with error handling, retry, and validated env config.

**Example usage:**
`lib/integrations/resend.ts` — `sendWelcomeEmail(user)`: calls Resend API, handles rate limits with retry, falls back gracefully on service unavailability.

**Inputs required:**
- Provider name and SDK
- Operations to support
- Error handling and retry requirements

**Outputs produced:**
- Integration module (`lib/integrations/[service].ts`)
- Typed wrapper functions
- Env var Zod validation
- Typed error classes

**Implementation approach:** `AI coding agent` + provider SDK

---

## 3. Frontend Skills

---

### FE-01 · UI Component Generation

**Description:**
Generate reusable, typed React components with well-defined props, loading/error/empty states, and accessible markup.

**Example usage:**
`<TaskCard task={Task} onToggle={fn}>` — title, assignee avatar, priority badge, due date, completion checkbox, skeleton loading variant, hover action menu.

**Inputs required:**
- Component name and purpose
- Props interface (fields, types, required/optional)
- Visual description or design reference
- States to handle
- Component library (shadcn/ui, MUI)

**Outputs produced:**
- `.tsx` file with typed props interface
- Semantic HTML JSX
- Tailwind design system classes
- Loading skeleton variant
- Exported component and types

**Implementation approach:** `AI coding agent` + `v0 by Vercel`

---

### FE-02 · Page Scaffolding

**Description:**
Generate complete App Router pages — async server component with data fetch, Suspense boundary, loading UI, error boundary, metadata export.

**Example usage:**
`app/(app)/tasks/page.tsx` — server fetch from Supabase, Suspense skeleton, empty state, task list. Plus `loading.tsx` and `error.tsx` siblings.

**Inputs required:**
- Page route and purpose
- Data to fetch
- Layout type (sidebar, full-width, split-panel)
- Auth requirement
- Child components

**Outputs produced:**
- `page.tsx` (async server component)
- `loading.tsx` (Suspense skeleton)
- `error.tsx` (error boundary with retry)
- `generateMetadata` export

**Implementation approach:** `AI coding agent`

---

### FE-03 · Form Generation

**Description:**
Generate fully functional forms with validation, submission handling, accessible markup, and server action or API integration.

**Example usage:**
"Create Task" — React Hook Form + Zod. Fields: title, description, assignee (select), due date (date picker), priority (radio). Submits via server action, Sonner toast on success.

**Inputs required:**
- Field names, types, validation rules
- Submission target (server action or API)
- Success behavior (toast, redirect, reset)
- Existing Zod schema to reuse

**Outputs produced:**
- `react-hook-form` + `@hookform/resolvers/zod` form
- Fields with labels, errors, `aria-*` attributes
- Submit button with loading state
- Success/error feedback

**Implementation approach:** `AI coding agent` + `react-hook-form` + `zod`

---

### FE-04 · State Management

**Description:**
Implement the correct state strategy per use case — server state, URL state, local UI state, global client state.

**Example usage:**
TanStack Query for task list (server state, optimistic updates). `nuqs` for filter/sort in URL (shareable). Zustand for sidebar open/closed (global UI).

**Inputs required:**
- Data classification (server / URL / UI / global)
- Mutation and optimistic update requirements
- Persistence requirements
- Scope

**Outputs produced:**
- TanStack Query hooks (`useQuery`, `useMutation`)
- Zustand store with typed state and actions
- `nuqs` typed URL param helpers
- Cache invalidation strategy

**Implementation approach:** `AI coding agent` + `@tanstack/react-query` + `zustand` + `nuqs`

---

### FE-05 · Client-Side API Integration

**Description:**
Generate typed TanStack Query hooks consuming Next.js API routes or Supabase from client components.

**Example usage:**
`useTasks(filters)` — fetches with pagination, cached by key. `useCreateTask()` — optimistic cache insert, reverts on error, invalidates on settle.

**Inputs required:**
- Endpoint URL and method
- Request/response TypeScript types
- Cache key and stale time
- Optimistic update requirements

**Outputs produced:**
- `useQuery` hook with typed data and error
- `useMutation` with optimistic update and rollback
- Cache invalidation on success
- Loading and error state exposure

**Implementation approach:** `AI coding agent` + `@tanstack/react-query`

---

### FE-06 · Responsive Layout Generation

**Description:**
Generate responsive Tailwind CSS layouts that work correctly at mobile, tablet, and desktop breakpoints.

**Example usage:**
App shell: collapsible sidebar (desktop), bottom-sheet nav (mobile), sticky header, max-width content container.

**Inputs required:**
- Layout description
- Breakpoint behavior
- Navigation pattern
- Density preference

**Outputs produced:**
- Layout components with Tailwind responsive classes
- Mobile sidebar drawer variant
- CSS Grid / Flexbox with consistent spacing

**Implementation approach:** `AI coding agent`

---

### FE-07 · Accessibility Compliance

**Description:**
Audit and fix accessibility in generated components — semantic HTML, ARIA, keyboard navigation, focus management, color contrast.

**Example usage:**
Data table: add `role="table"`, `aria-label`, `<th scope>`, keyboard row selection, visible `focus-visible` ring.

**Inputs required:**
- Component code to audit
- WCAG target level (AA minimum)
- Interactive patterns to validate

**Outputs produced:**
- Corrected semantic HTML
- `aria-label`, `aria-describedby`, `role` additions
- Focus trap for modals and dialogs
- Skip-to-content link

**Implementation approach:** `AI coding agent` + `axe-core`

---

### FE-08 · Real-Time Data Integration

**Description:**
Add Supabase Realtime subscriptions to client components needing live-updating data — replacing polling with WebSocket updates.

**Example usage:**
Task board subscribes to `tasks` filtered by `org_id`. On INSERT/UPDATE/DELETE, updates TanStack Query cache via `setQueryData` instead of full refetch.

**Inputs required:**
- Table and filter conditions
- Events to listen for
- Cache update strategy

**Outputs produced:**
- `useEffect` with `supabase.channel()` subscription
- `queryClient.setQueryData()` cache update logic
- Cleanup on unmount
- Optional connection status indicator

**Implementation approach:** `AI coding agent` + `@supabase/supabase-js` Realtime

---

## 4. UI/UX Skills

---

### UX-01 · Design System Generation

**Description:**
Establish a design system with color tokens, typography scale, and spacing — encoded in `tailwind.config.ts` and CSS custom properties.

**Example usage:**
B2B SaaS: neutral gray palette, brand blue accent, Geist Sans body, Geist Mono code, 4px base unit, consistent border-radius, full dark mode via CSS variables.

**Inputs required:**
- Brand colors (hex or direction)
- Typography preference
- Corner radius style
- Dark mode requirement

**Outputs produced:**
- `tailwind.config.ts` with extended tokens
- `app/globals.css` with CSS custom properties
- Color palette (50–950 scale)
- Typography scale with line-heights
- Dark mode via `class` strategy

**Implementation approach:** `AI coding agent` + shadcn/ui theming

---

### UX-02 · Component Library Setup

**Description:**
Bootstrap and theme shadcn/ui — installing, configuring, and applying the project design system to all base components.

**Example usage:**
Install and theme: Button (3 variants), Input, Select, Dialog, Sheet, Table, Badge, Card, Tabs — all using CSS variables so a theme switch is one variable change.

**Inputs required:**
- Library choice (shadcn/ui, Radix, MUI)
- Design tokens from UX-01
- Required component list

**Outputs produced:**
- `components/ui/` with installed components
- Project theme applied
- `components.json` config
- Custom variant extensions

**Implementation approach:** `shadcn/ui CLI` + `AI coding agent`

---

### UX-03 · Tailwind Layout Generation

**Description:**
Generate precise Tailwind layouts for dashboards, data tables, split views, and card grids — no custom CSS.

**Example usage:**
Analytics dashboard: 4-column KPI row (→ 2-col tablet → 1-col mobile), 2:1 chart + feed split, full-width table below.

**Inputs required:**
- Layout description or wireframe
- Responsive behavior
- Component slots
- Density preference

**Outputs produced:**
- JSX with Tailwind grid/flex classes
- Responsive class variants per breakpoint
- Container and max-width constraints

**Implementation approach:** `AI coding agent`

---

### UX-04 · Interaction & Animation Design

**Description:**
Add micro-interactions, transitions, and entry animations using Framer Motion or Tailwind.

**Example usage:**
Staggered task card entries, smooth sidebar collapse, optimistic UI feedback before server confirmation.

**Inputs required:**
- Interactions to animate
- Desired feel (snappy, smooth, playful)
- `prefers-reduced-motion` requirement

**Outputs produced:**
- Framer Motion `motion.div` with variants
- `AnimatePresence` for exit animations
- Tailwind transitions for hover/focus
- Reduced-motion media query respect

**Implementation approach:** `AI coding agent` + `framer-motion`

---

### UX-05 · Loading & Error State Design

**Description:**
Generate consistent loading skeletons, error states, and empty states across data-dependent components.

**Example usage:**
Task list: skeleton rows matching content shape; error state with retry; empty state with icon, headline, "Create your first task" CTA.

**Inputs required:**
- Component to create states for
- Content shape (for skeleton)
- Error recovery options
- Empty state CTA

**Outputs produced:**
- Skeleton using `shadcn/ui Skeleton`
- Error state with retry action
- Empty state with icon + CTA
- Unified state-switcher wrapper

**Implementation approach:** `AI coding agent`

---

### UX-06 · Dashboard Layout Design

**Description:**
Generate complete dashboards with KPI cards, charts, tables, and activity feeds wired to real data.

**Example usage:**
4 KPI cards, revenue line chart, signups bar chart, activity feed, top customers table — server-fetched on load, client-refreshed every 60 seconds.

**Inputs required:**
- Metrics and data sources
- Chart types
- Refresh strategy (SSR / polling / realtime)
- Density preference

**Outputs produced:**
- Dashboard page with grid layout
- KPI cards with trend indicators
- Chart components (Recharts or Tremor)
- Sortable paginated data table

**Implementation approach:** `AI coding agent` + `recharts` or `tremor`

---

### UX-07 · Notification & Toast System

**Description:**
Implement a consistent, accessible notification system for action feedback, errors, and background job completions.

**Example usage:**
Task created → success toast. API failure → error toast with "Try again." Export complete → persistent toast with download link.

**Inputs required:**
- Toast types (success, error, warning, info)
- Dismissal behavior (auto vs. persistent)
- Position preference
- Action support (undo, view, dismiss)

**Outputs produced:**
- Sonner setup in root layout
- Typed toast helpers
- Toast calls on all mutation success/error handlers

**Implementation approach:** `AI coding agent` + `sonner`

---

## 5. DevOps Skills

---

### DO-01 · CI/CD Pipeline Setup

**Description:**
Create GitHub Actions workflows for automated testing, type-checking, linting, and deployment validation on every PR and push to main.

**Example usage:**
On PR: `tsc --noEmit` + `eslint` + `vitest` + Playwright on Vercel preview URL. Block merge if any check fails.

**Inputs required:**
- Repository structure
- Test frameworks
- Required CI secrets

**Outputs produced:**
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- Secrets list with descriptions
- README badge

**Implementation approach:** `GitHub Actions`

---

### DO-02 · Vercel Deployment Automation

**Description:**
Configure Vercel project settings, build commands, env vars, and deployment rules via `vercel.json` and CLI — reproducibly.

**Example usage:**
`vercel.json` specifies build command. CI deploys with `vercel --prod --token $VERCEL_TOKEN` after all checks pass.

**Inputs required:**
- Build command and output directory
- Env vars per environment
- Domain configuration

**Outputs produced:**
- `vercel.json`
- Env var provisioning script
- CI deploy step
- Preview URL extraction script for E2E

**Implementation approach:** `Vercel CLI` + `AI coding agent`

---

### DO-03 · Environment Variable Management

**Description:**
Define, validate, document, and provision all env vars across local, preview, and production with type-safe runtime access.

**Example usage:**
`env.ts` uses `@t3-oss/env-nextjs` + Zod to validate at build time. `.env.example` documents every variable. Vercel CLI provisions per environment.

**Inputs required:**
- Env variable names and types
- Which environment each applies to
- Validation rules

**Outputs produced:**
- `env.ts` with `@t3-oss/env-nextjs` Zod schema
- `.env.example` with names and descriptions
- `.env.local` onboarding template
- Vercel provisioning script

**Implementation approach:** `AI coding agent` + `@t3-oss/env-nextjs`

---

### DO-04 · Preview Environment Management

**Description:**
Leverage Vercel preview deployments per PR for isolated feature testing, connected to a Supabase branch or staging DB.

**Example usage:**
Each PR gets a Vercel preview URL + Supabase branch DB. E2E tests run against the preview. Branch deleted on PR close.

**Inputs required:**
- Vercel project config
- Supabase branching strategy
- Preview URL pattern

**Outputs produced:**
- Vercel preview config
- Supabase branch creation/teardown in CI
- Preview URL extraction for E2E runner

**Implementation approach:** `Vercel` (native) + `Supabase CLI` branching

---

### DO-05 · Monitoring Setup

**Description:**
Configure error monitoring, performance monitoring, and uptime checks for production.

**Example usage:**
Sentry for frontend + API errors with source maps. Vercel Analytics for Web Vitals. BetterStack uptime pings `/api/health` every minute, Slacks on downtime.

**Inputs required:**
- Services to monitor
- Alert channel
- Error sampling rate
- Performance budget

**Outputs produced:**
- `sentry.client.config.ts` + `sentry.server.config.ts`
- Source map upload in CI
- Vercel Analytics in root layout
- Uptime monitor config

**Implementation approach:** `Sentry` (free tier) + `Vercel Analytics` (free tier) + `BetterStack` (free tier)

---

### DO-06 · Database Backup & Recovery

**Description:**
Configure automated backups and document a tested restore procedure for the production Supabase database.

**Example usage:**
Supabase Pro handles daily backups and PITR. Weekly GitHub Actions job dumps the DB to Supabase Storage. Restore runbook tested quarterly.

**Inputs required:**
- Supabase plan
- Retention period
- Restore requirements

**Outputs produced:**
- Weekly backup cron job
- `supabase db dump` script
- `docs/runbooks/database-restore.md`

**Implementation approach:** `Supabase` (Pro built-in) + `GitHub Actions`

---

## 6. Testing Skills

---

### TE-01 · Unit Test Generation

**Description:**
Generate Vitest unit tests for pure functions, utilities, Zod schemas, and service modules — happy path, edge cases, error branches.

**Example usage:**
`formatCurrency(amount, currency)`: correct output for positive, negative, zero, large numbers, invalid inputs. All branches covered.

**Inputs required:**
- Function or module to test
- Input/output examples
- Edge cases
- Mocking requirements

**Outputs produced:**
- Test file with `describe`/`it`/`expect` AAA pattern
- `vi.mock()` for external dependencies
- Full branch coverage

**Implementation approach:** `AI coding agent` + `vitest`

---

### TE-02 · Integration Test Generation

**Description:**
Generate integration tests for API routes and server actions testing the full request/response cycle.

**Example usage:**
`POST /api/tasks`: authenticated → 201 with created row. Unauthenticated → 401. Invalid body → 400 with Zod field errors.

**Inputs required:**
- Route or action to test
- Auth scenarios
- Request body variants
- Expected response status and body

**Outputs produced:**
- Test file with Vitest + Supabase local emulator
- Auth session mock
- Request builder helper
- Assertions on status, body, and DB state

**Implementation approach:** `AI coding agent` + `vitest` + Supabase local emulator

---

### TE-03 · API Test Collection

**Description:**
Generate a Bruno collection documenting and testing all API routes.

**Example usage:**
Bruno collection with every `/api/*` route, pre-request auth token scripts, example bodies, response assertion scripts.

**Inputs required:**
- All API route definitions
- Auth flow for test tokens
- Base URLs per environment

**Outputs produced:**
- `bruno/` collection directory
- Request file per endpoint
- Environment configs
- Response assertion scripts

**Implementation approach:** `AI coding agent` + `Bruno` (open-source)

---

### TE-04 · E2E Test Automation

**Description:**
Generate Playwright E2E tests simulating complete user flows.

**Example usage:**
"Create and complete a task": navigate → login → click "New Task" → fill → submit → verify in list → check off → verify complete.

**Inputs required:**
- User flow steps
- Test user credentials (env)
- Target URL
- Step-level assertions

**Outputs produced:**
- `e2e/[flow].spec.ts`
- Page Object Model for reusable selectors
- `playwright.config.ts`
- CI step targeting Vercel preview URL

**Implementation approach:** `AI coding agent` + `@playwright/test`

---

### TE-05 · Component Testing

**Description:**
Generate React Testing Library tests verifying component rendering, interactions, and state changes.

**Example usage:**
`<TaskCard>`: renders title and due date; toggle calls `onToggle`; shows "Overdue" badge when past due date.

**Inputs required:**
- Component to test
- Props variants including edge cases
- Interactions to simulate
- DOM assertions

**Outputs produced:**
- Test file with `@testing-library/react` + Vitest
- `render()` with prop variants
- `userEvent` interactions
- `expect()` DOM assertions

**Implementation approach:** `AI coding agent` + `@testing-library/react` + `vitest`

---

### TE-06 · Test Data Factory Generation

**Description:**
Generate typed factory functions for test data — avoiding hardcoded fixtures.

**Example usage:**
`createTask({ status: 'overdue' })` returns a full `Task` with all fields populated with sensible defaults, overriding only `status`.

**Inputs required:**
- TypeScript type or Zod schema
- Default value strategy
- Override pattern

**Outputs produced:**
- Factory file with `@faker-js/faker` defaults
- `Partial<Entity>` override parameter
- Exported for use across all tests

**Implementation approach:** `AI coding agent` + `@faker-js/faker`

---

## 7. Data & Document Processing Skills

---

### DP-01 · Document Ingestion Pipeline

**Description:**
Accept uploaded documents (PDF, DOCX, CSV), extract content, and store in Supabase for downstream processing.

**Example usage:**
User uploads PDF → Storage trigger → Edge Function → LlamaParse extracts text → stored in `documents` table → Inngest event fires for embedding.

**Inputs required:**
- File types and size limits
- Storage bucket config
- Parsing requirements
- Downstream trigger

**Outputs produced:**
- Supabase Storage bucket + upload policy
- Edge Function on storage insert
- `documents` table with parsed content
- Inngest downstream event

**Implementation approach:** `AI coding agent` + `LlamaParse` (free tier) + `Supabase Edge Functions`

---

### DP-02 · Structured Data Extraction

**Description:**
Extract typed structured data from document text using an LLM with JSON-mode output — Zod-validated before DB insert.

**Example usage:**
Invoice PDF → `{ vendor_name, invoice_number, line_items[], total_amount, due_date }` — validated, inserted into `invoices` table.

**Inputs required:**
- Parsed document text
- Target TypeScript interface or Zod schema
- Extraction prompt or few-shot examples

**Outputs produced:**
- LLM call with JSON-mode output
- Zod-validated extracted data
- Insert into target table

**Implementation approach:** `AI coding agent` + Claude API (structured output)

---

### DP-03 · Vector Embedding & Indexing

**Description:**
Chunk document content, generate embeddings, store in Supabase pgvector for semantic search.

**Example usage:**
Split document into 512-token chunks → embed with Voyage AI → store in `document_embeddings` with vector, text, and metadata.

**Inputs required:**
- Text content to embed
- Embedding model
- Chunk size and overlap
- Metadata to store

**Outputs produced:**
- Chunks in pgvector column
- `match_documents` similarity search function
- HNSW index for fast ANN search

**Implementation approach:** `AI coding agent` + `Voyage AI` + `Supabase pgvector`

---

### DP-04 · Semantic Search Pipeline

**Description:**
Accept a natural language query, embed it, perform cosine similarity search, return ranked results with excerpts.

**Example usage:**
"Contracts with penalty clauses" → embed → pgvector top-5 → return with document name, page reference, highlighted excerpt.

**Inputs required:**
- Query string
- Vector table and similarity function
- Result count and metadata filters

**Outputs produced:**
- Embedded query vector
- SQL cosine similarity search (`<=>`)
- Ranked results with scores
- Search results UI component

**Implementation approach:** `AI coding agent` + `Supabase pgvector`

---

### DP-05 · RAG Integration

**Description:**
Answer questions grounded in the user's own documents with source citations — using retrieved chunks as LLM context.

**Example usage:**
"What are my payment terms across all contracts?" → top-10 relevant chunks → Claude streaming answer with inline citations.

**Inputs required:**
- User query
- Retrieved chunks (from DP-04)
- System prompt and citation format
- Streaming requirement

**Outputs produced:**
- Context-stuffed LLM prompt
- Streamed response with citations
- Source reference list
- Vercel AI SDK streaming handler

**Implementation approach:** `AI coding agent` + Claude API + `ai` (Vercel AI SDK)

---

### DP-06 · File Processing Queue

**Description:**
Build a reliable, retryable file processing queue with user-visible status tracking.

**Example usage:**
Upload → `file_jobs` row (status: `pending`) → Inngest processes → updates to `complete` or `failed`. User sees live status via Realtime.

**Inputs required:**
- Job states
- Retry configuration
- User-facing status requirements

**Outputs produced:**
- `file_processing_jobs` Postgres table
- Inngest function with retry config
- Realtime status subscription in UI
- Completion/failure notification

**Implementation approach:** `AI coding agent` + `Inngest` + `Supabase Realtime`

---

### DP-07 · CSV / Spreadsheet Import

**Description:**
Build a CSV/Excel import pipeline with column mapping, row-level validation, preview, and bulk insert with error reporting.

**Example usage:**
Contacts CSV upload → auto-map headers → preview with row errors highlighted → confirm → bulk upsert valid rows → report (N inserted, M failed).

**Inputs required:**
- Target table schema
- CSV/Excel file
- Validation rules per column
- Conflict handling (skip vs. upsert)

**Outputs produced:**
- Column mapping interface
- Row-level validation with errors
- Preview component
- Bulk `upsert` via Supabase client
- Import results summary

**Implementation approach:** `AI coding agent` + `papaparse` + `xlsx`

---

*Last updated: March 2026 | Version 1.0*
*Companion documents: `tools.md` | `architecture.md`*
