# Application Architecture
## Next.js (App Router) + Supabase + Vercel + TypeScript

> The recommended project architecture for AI-assisted full-stack development. Designed for autonomous code generation, clear separation of concerns, and maximum agentic editability.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Data Flow Architecture](#3-data-flow-architecture)
4. [Database Architecture](#4-database-architecture)
5. [Authentication & Authorization Architecture](#5-authentication--authorization-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Background Job Architecture](#8-background-job-architecture)
9. [Document Processing Architecture](#9-document-processing-architecture)
10. [AI Feature Architecture](#10-ai-feature-architecture)
11. [Testing Architecture](#11-testing-architecture)
12. [DevOps Architecture](#12-devops-architecture)
13. [Key Design Decisions](#13-key-design-decisions)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│   Next.js App Router — React Server + Client Components     │
│   shadcn/ui + Tailwind · Framer Motion · TanStack Query     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────────┐
│                      SERVER LAYER                           │
│   Next.js API Routes · Server Actions · Middleware          │
│   Zod Validation · RBAC Guards · Supabase Server Client     │
└────────────┬──────────────────────────┬─────────────────────┘
             │ SQL / JS Client          │ Events
┌────────────▼──────────┐   ┌──────────▼──────────────────────┐
│      SUPABASE          │   │      INNGEST (Background Jobs)  │
│  Postgres + pgvector   │   │  Email · Webhooks · Processing  │
│  Auth + Storage        │   │  Scheduled Tasks · Retries      │
│  Realtime + Edge Fns   │   └─────────────────────────────────┘
│  RLS Policies          │
└───────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                            │
│  Resend (email) · Stripe (payments) · LlamaParse (docs)       │
│  Voyage AI (embeddings) · Claude API (AI features)            │
└───────────────────────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────────┐
│                  OBSERVABILITY                                │
│  Sentry (errors) · Vercel Analytics (performance)             │
│  Langfuse (LLM traces) · BetterStack (uptime)                 │
└───────────────────────────────────────────────────────────────┘
```

**Core principles:**
1. **Server-first** — data fetching in Server Components, mutations in Server Actions
2. **Database as the security boundary** — RLS policies enforce access at the DB layer, not just the API
3. **Async by default** — background jobs via Inngest for any work that can be deferred
4. **Type-safe end-to-end** — generated Supabase types flow from schema → server → client
5. **AI-editable structure** — every directory has a single, clear responsibility so agents can find and modify the right file

---

## 2. Directory Structure

```
project-root/
│
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # Public marketing pages (no auth)
│   │   ├── page.tsx                  # Landing page
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (app)/                        # Authenticated application
│   │   ├── layout.tsx                # App shell (sidebar, header)
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Async server component
│   │   │   ├── loading.tsx           # Suspense skeleton
│   │   │   └── error.tsx             # Error boundary
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts         # OAuth code exchange
│   │
│   └── api/
│       ├── inngest/route.ts          # Inngest webhook handler
│       ├── webhooks/
│       │   └── stripe/route.ts       # Stripe webhook
│       └── [resource]/
│           └── route.ts              # API route handlers
│
├── components/
│   ├── ui/                           # shadcn/ui base components (auto-generated)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── [feature]/                    # Feature-specific components
│   │   ├── task-card.tsx
│   │   ├── task-list.tsx
│   │   └── task-form.tsx
│   └── shared/                       # Shared across features
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       ├── data-table.tsx
│       └── user-avatar.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server/cookie-based client
│   │   └── admin.ts                  # Service role client (server-only)
│   ├── auth/
│   │   ├── permissions.ts            # RBAC permission matrix
│   │   └── guards.ts                 # requirePermission(), requireRole()
│   ├── services/                     # Business logic (framework-agnostic)
│   │   ├── tasks.ts
│   │   ├── organizations.ts
│   │   └── subscriptions.ts
│   ├── integrations/                 # Third-party API wrappers
│   │   ├── resend.ts
│   │   ├── stripe.ts
│   │   └── anthropic.ts
│   ├── validations/                  # Zod schemas (shared server + client)
│   │   ├── tasks.ts
│   │   └── users.ts
│   └── utils/                        # Pure utility functions
│       ├── format.ts
│       └── dates.ts
│
├── hooks/                            # Client-side React hooks
│   ├── use-tasks.ts                  # TanStack Query data hooks
│   ├── use-session.ts
│   └── use-permission.ts
│
├── actions/                          # Next.js Server Actions
│   ├── tasks.ts
│   ├── users.ts
│   └── organizations.ts
│
├── store/                            # Zustand global client state
│   └── ui.ts                         # Sidebar, theme, modals
│
├── inngest/                          # Background job definitions
│   ├── client.ts                     # Inngest client
│   └── functions/
│       ├── send-welcome-email.ts
│       ├── process-document.ts
│       └── sync-subscription.ts
│
├── types/
│   ├── database.types.ts             # Auto-generated by Supabase CLI
│   └── index.ts                      # Manual type exports
│
├── supabase/
│   ├── migrations/                   # SQL migration files (versioned)
│   ├── functions/                    # Supabase Edge Functions
│   │   └── process-upload/
│   │       └── index.ts
│   └── seed.sql                      # Development seed data
│
├── e2e/                              # Playwright E2E tests
│   ├── fixtures/
│   ├── pages/                        # Page Object Models
│   └── flows/                        # User flow tests
│
├── middleware.ts                     # Next.js middleware (auth protection)
├── env.ts                            # @t3-oss/env-nextjs type-safe env
├── tailwind.config.ts
├── components.json                   # shadcn/ui config
└── .cursorrules                      # AI agent project conventions
```

---

## 3. Data Flow Architecture

### Read Flow (Server Component)
```
Browser Request
  → Next.js middleware (session check)
    → Route Group layout (fetch session/org)
      → Page Server Component (async data fetch)
        → Supabase Server Client (with RLS)
          → Postgres (RLS filters data automatically)
            → Typed response → render to HTML
              → Stream to browser
```

### Mutation Flow (Server Action)
```
User submits form
  → React calls Server Action
    → Zod validates input (server-side)
      → requirePermission() checks RBAC
        → lib/services/[domain].ts runs business logic
          → Supabase Server Client (with RLS)
            → Postgres mutation
              → Inngest event fired (if async work needed)
                → revalidatePath() or revalidateTag()
                  → Updated data streamed back to client
```

### Real-Time Flow
```
Supabase DB row changed
  → Supabase Realtime broadcasts change
    → Client channel subscription receives event
      → queryClient.setQueryData() updates cache
        → React re-renders with new data (no full refetch)
```

### Background Job Flow
```
Event fired (user signed up, file uploaded, webhook received)
  → Inngest receives event
    → Function triggered (with automatic retry)
      → Steps execute (each step is durable)
        → External API calls (Resend, Stripe, etc.)
          → DB updated via Supabase admin client
            → Completion event fired (if chaining)
```

---

## 4. Database Architecture

### Schema Design Principles

1. **Row-level ownership:** Every table that holds user data has either `user_id uuid references auth.users` or `org_id uuid references organizations` — RLS filters by this column.

2. **Soft deletes:** Use `deleted_at timestamptz` instead of `DELETE` for all user-visible data. Hard deletes only for PII removal on account closure.

3. **Audit fields on every table:**
```sql
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
created_by uuid references auth.users(id)
```

4. **UUIDs for all PKs:**
```sql
id uuid primary key default gen_random_uuid()
```

### Standard Table Patterns

```sql
-- Multi-tenant pattern
create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null check (char_length(title) between 1 and 200),
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_tasks_org_status on tasks (org_id, status) where deleted_at is null;
create index idx_tasks_created_by on tasks (created_by) where deleted_at is null;

-- Auto-update updated_at
create trigger tasks_updated_at
  before update on tasks
  for each row execute function moddatetime(updated_at);

-- RLS
alter table tasks enable row level security;

create policy "org members can read org tasks"
  on tasks for select
  using (
    org_id in (
      select org_id from org_members
      where user_id = auth.uid()
    )
  );

create policy "org members can insert tasks"
  on tasks for insert
  with check (
    org_id in (
      select org_id from org_members
      where user_id = auth.uid()
    )
  );
```

### Migration Workflow
```
1. Edit schema design file or describe change
2. Run: supabase db diff --file describe_change
3. Review generated migration SQL
4. Commit migration file
5. Run: supabase gen types typescript
6. Commit updated types/database.types.ts
7. TypeScript compiler validates all queries against new types
```

---

## 5. Authentication & Authorization Architecture

### Auth Flow
```
Unauthenticated request to /app/* route
  → middleware.ts detects no session
    → redirect to /auth/login

User submits login form
  → supabase.auth.signInWithPassword() or signInWithOAuth()
    → Supabase issues JWT + refresh token
      → Stored in HTTP-only cookies (via @supabase/ssr)
        → redirect to /app/dashboard

Subsequent requests
  → middleware.ts reads cookie → calls supabase.auth.getUser()
    → Valid: pass through (session added to request)
    → Invalid/expired: redirect to /auth/login
```

### Supabase Client Strategy

Three clients, three contexts:

```typescript
// lib/supabase/client.ts — Browser (client components)
// Uses anon key, auth via localStorage cookie
export const createBrowserClient = () =>
  createBrowserSupabaseClient<Database>({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

// lib/supabase/server.ts — Server (RSC, API routes, Server Actions)
// Uses anon key + cookie session — respects RLS
export const createServerClient = () => {
  const cookieStore = cookies();
  return createServerSupabaseClient<Database>({ cookieStore });
};

// lib/supabase/admin.ts — Server only, bypasses RLS
// Used only in Inngest functions and admin operations
export const createAdminClient = () =>
  createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY  // Never exposed to client
  );
```

### RBAC Pattern

```typescript
// lib/auth/permissions.ts
export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type Action = 'create' | 'read' | 'update' | 'delete';
export type Resource = 'task' | 'member' | 'settings' | 'billing';

const PERMISSIONS: Record<Role, Record<Resource, Action[]>> = {
  owner:  { task: ['create','read','update','delete'], settings: ['read','update'], billing: ['read','update'], member: ['create','read','update','delete'] },
  admin:  { task: ['create','read','update','delete'], settings: ['read','update'], billing: ['read'],          member: ['create','read','update'] },
  member: { task: ['create','read','update'],          settings: ['read'],          billing: [],                member: ['read'] },
  viewer: { task: ['read'],                            settings: ['read'],          billing: [],                member: ['read'] },
};

export const can = (role: Role, action: Action, resource: Resource): boolean =>
  PERMISSIONS[role]?.[resource]?.includes(action) ?? false;

// lib/auth/guards.ts — Server-side guard for API routes / Server Actions
export async function requirePermission(action: Action, resource: Resource) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!member || !can(member.role as Role, action, resource)) {
    throw new ForbiddenError();
  }
  return { user, role: member.role };
}
```

---

## 6. Frontend Architecture

### Component Hierarchy
```
app/(app)/layout.tsx           ← App shell (server, fetches session + org)
  ├── components/shared/Sidebar.tsx     (client — interactive)
  ├── components/shared/Header.tsx      (client — search, user menu)
  └── {page slot}
      └── app/(app)/tasks/page.tsx      (server — async data fetch)
          ├── loading.tsx               (Suspense boundary)
          └── components/tasks/TaskList.tsx   (client — realtime, interactions)
              └── components/tasks/TaskCard.tsx
```

### Server vs. Client Component Decision

| Pattern | Server Component | Client Component |
|---|---|---|
| Initial data fetch | ✓ | |
| Static content | ✓ | |
| Uses `async/await` | ✓ | |
| Needs `useState` / `useEffect` | | ✓ |
| Needs browser APIs | | ✓ |
| Needs Realtime subscription | | ✓ |
| Interactive (clicks, forms) | | ✓ |
| Uses TanStack Query | | ✓ |

**Rule:** Default to Server Components. Add `'use client'` only when you need client-only features. Push `'use client'` as far down the tree as possible.

### State Management Decision Tree
```
Is this server data? (fetched from DB/API)
  → Yes: TanStack Query (useQuery / useMutation)
    → Does it need to be in the URL? (shareable link, pagination)
      → Yes: nuqs (useQueryState)

Is this UI state only? (open/closed, selected tab)
  → Is it component-local?
    → Yes: useState / useReducer
  → Does it need to be global? (sidebar, modal, theme)
    → Yes: Zustand store
```

---

## 7. Backend Architecture

### API Route Structure
```typescript
// app/api/tasks/route.ts
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/guards';
import { CreateTaskSchema } from '@/lib/validations/tasks';
import { createTask } from '@/lib/services/tasks';

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? 1);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)
    .range((page - 1) * 20, page * 20 - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  await requirePermission('create', 'task');  // throws 401/403 if not allowed

  const body = await request.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await createTask(parsed.data);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
```

### Server Action Structure
```typescript
// actions/tasks.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/guards';
import { CreateTaskSchema } from '@/lib/validations/tasks';
import { revalidatePath } from 'next/cache';
import { inngest } from '@/inngest/client';

export async function createTaskAction(formData: FormData) {
  const { user } = await requirePermission('create', 'task');

  const raw = Object.fromEntries(formData);
  const parsed = CreateTaskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  // Fire background event if needed
  await inngest.send({ name: 'task/created', data: { task: data } });

  revalidatePath('/tasks');
  return { data };
}
```

---

## 8. Background Job Architecture

```typescript
// inngest/functions/send-welcome-email.ts
import { inngest } from '../client';
import { resend } from '@/lib/integrations/resend';

export const sendWelcomeEmail = inngest.createFunction(
  {
    id: 'send-welcome-email',
    retries: 5,
    // Rate limiting: max 10 welcome emails per 1 minute
    rateLimit: { limit: 10, period: '1m', key: 'event.data.user.id' },
  },
  { event: 'user/signed-up' },
  async ({ event, step }) => {
    // Each step.run() is durable — if the function crashes, it resumes here
    const user = await step.run('fetch-user', async () => {
      const { data } = await supabaseAdmin.from('users').select().eq('id', event.data.userId).single();
      return data;
    });

    await step.run('send-welcome', () =>
      resend.sendWelcomeEmail({ to: user.email, name: user.full_name })
    );

    await step.sleep('wait-3-days', '3 days');

    await step.run('send-tips', () =>
      resend.sendProductTips({ to: user.email, name: user.full_name })
    );
  }
);

// Register in app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { sendWelcomeEmail } from '@/inngest/functions/send-welcome-email';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendWelcomeEmail],
});
```

---

## 9. Document Processing Architecture

```
File Upload
  ↓
Supabase Storage (documents bucket)
  ↓ storage.objects INSERT trigger
Supabase Edge Function: process-upload
  ↓
LlamaParse API → Markdown text
  ↓
Store in documents table (raw text)
  ↓
Inngest event: document/uploaded
  ↓
Inngest Function: embed-document
  ├── step: chunk-text (512 tokens, 50 overlap)
  ├── step: generate-embeddings (Voyage AI voyage-3)
  └── step: store-embeddings (Supabase pgvector)
  ↓
document_status = 'indexed'
  ↓
Supabase Realtime → UI shows "Ready"
```

```sql
-- Vector search function
create or replace function match_documents(
  query_embedding vector(1024),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language sql stable
as $$
  select
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity,
    metadata
  from document_embeddings
  where
    (filter_user_id is null or user_id = filter_user_id)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## 10. AI Feature Architecture

```typescript
// app/api/chat/route.ts — Streaming RAG endpoint
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerClient } from '@/lib/supabase/server';
import { embed } from '@/lib/embeddings';

export async function POST(request: Request) {
  const { messages } = await request.json();
  const userMessage = messages[messages.length - 1].content;

  // 1. Retrieve relevant context
  const queryEmbedding = await embed(userMessage);
  const supabase = createServerClient();
  const { data: chunks } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 5,
  });

  // 2. Build context string
  const context = chunks?.map(c => `[${c.metadata.source}]\n${c.content}`).join('\n\n') ?? '';

  // 3. Stream response
  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `You are a helpful assistant. Answer questions using ONLY the provided context.
Always cite sources by referencing the [source] labels.
If the answer is not in the context, say so clearly.

Context:
${context}`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

---

## 11. Testing Architecture

```
tests/
├── unit/                          # Pure function tests (no DB, no network)
│   ├── lib/utils/format.test.ts
│   └── lib/validations/tasks.test.ts
│
├── integration/                   # API route + server action tests
│   ├── api/tasks.test.ts          # Uses Supabase local emulator
│   └── actions/tasks.test.ts
│
├── components/                    # RTL component tests
│   ├── TaskCard.test.tsx
│   └── TaskForm.test.tsx
│
└── e2e/                           # Playwright flow tests
    ├── flows/
    │   ├── auth.spec.ts           # Login / signup / logout
    │   ├── tasks.spec.ts          # CRUD task flows
    │   └── onboarding.spec.ts     # New user onboarding
    └── pages/                     # Page Object Models
        ├── LoginPage.ts
        └── TasksPage.ts
```

### Test Execution in CI
```yaml
# .github/workflows/ci.yml
jobs:
  test:
    steps:
      - name: Type check
        run: pnpm tsc --noEmit

      - name: Lint
        run: pnpm eslint

      - name: Unit + Integration tests
        run: pnpm vitest run
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}

      - name: E2E tests
        run: pnpm playwright test
        env:
          BASE_URL: ${{ steps.deploy.outputs.preview_url }}  # Vercel preview
```

---

## 12. DevOps Architecture

### Environments

| Environment | DB | Deployment | Purpose |
|---|---|---|---|
| Local | Supabase local (`supabase start`) | `next dev` | Development |
| Preview | Supabase branch (per PR) | Vercel preview | PR review + E2E tests |
| Production | Supabase production project | Vercel production | Live users |

### CI/CD Flow
```
Developer pushes branch → opens PR
  ↓
GitHub Actions: CI workflow
  ├── tsc --noEmit (type check)
  ├── eslint (lint)
  ├── vitest run (unit + integration)
  └── IF all pass: Vercel creates preview deployment
      ↓
      Playwright E2E runs against preview URL
      ↓
      Results posted as PR comment
  
PR approved + merged to main
  ↓
GitHub Actions: Deploy workflow
  ├── supabase db push (apply migrations to production)
  └── vercel --prod (promote to production)
      ↓
      Smoke tests against production URL
      ↓
      Slack notification: deployment complete
```

---

## 13. Key Design Decisions

### Decision 1: Server Actions over API Routes for Mutations

**Why:** Server Actions are co-located with the feature, require less boilerplate, integrate directly with React's `useActionState`, and benefit from Next.js cache revalidation. API routes are used only for external webhooks, third-party integrations, and endpoints consumed by non-React clients.

**Rule:** Use Server Actions for form submissions and user-triggered mutations. Use API routes for webhooks and external API consumers.

---

### Decision 2: RLS as the Primary Security Boundary

**Why:** Application-level auth checks can be bypassed by bugs, missing guards, or direct DB access. RLS enforces access at the database level — even a service role bug cannot expose another user's data if RLS is correctly written.

**Rule:** Every table with user data has RLS enabled. RLS policies are the source of truth for access control. Application-level RBAC is a UX layer on top.

---

### Decision 3: Supabase pgvector over a Dedicated Vector DB

**Why:** At typical indie/startup scale (< 10M embeddings), pgvector with an HNSW index performs comparably to dedicated vector databases. Eliminating Pinecone/Qdrant removes one service, one API key, one failure point, and cost at small scale.

**Rule:** Start with pgvector. Migrate to a dedicated vector DB only when you have measurable evidence that pgvector is the bottleneck.

---

### Decision 4: Inngest over Custom Queue

**Why:** Building a reliable job queue (retry, backoff, dead-letter, scheduling, monitoring) is weeks of engineering and ongoing operational overhead. Inngest's free tier covers 50K runs/month and requires only one route file.

**Rule:** Use Inngest for all background work. Never implement retry logic, cron, or job queuing manually.

---

### Decision 5: Generated Types from Schema

**Why:** Manually maintained types drift from the actual schema. Auto-generated types via `supabase gen types typescript` ensure that TypeScript catches schema/code mismatches at compile time, not at runtime in production.

**Rule:** Never manually write Supabase table types. Always run `supabase gen types typescript` post-migration and commit the result.

---

## 14. Implementation Roadmap

### Week 1: Foundation
- [ ] Initialize Next.js with TypeScript and Tailwind
- [ ] Connect Supabase project, configure local dev
- [ ] Install shadcn/ui, configure design tokens
- [ ] Set up `@t3-oss/env-nextjs` for type-safe env vars
- [ ] Configure `middleware.ts` with Supabase Auth session check
- [ ] Set up Inngest (one route file + client)
- [ ] Install Sentry, Vercel Analytics
- [ ] Create `.cursorrules` with project conventions
- [ ] Set up `supabase gen types typescript` in post-migration hook

### Week 2: Auth + Core Data Model
- [ ] Implement login/signup pages (email + at least one OAuth)
- [ ] Design and migrate core schema (users, organizations, org_members)
- [ ] Write RLS policies for all core tables
- [ ] Implement RBAC permission matrix
- [ ] Create seed data for local development
- [ ] Set up GitHub Actions CI (type check + lint + Vitest)

### Week 3: Core Feature Loop
- [ ] Scaffold first main feature (CRUD with Server Actions)
- [ ] Generate UI with v0, integrate with real data
- [ ] Add TanStack Query for client-side data management
- [ ] Add Realtime subscription for the primary data entity
- [ ] Write unit tests for business logic
- [ ] Write integration tests for API routes/actions
- [ ] Set up Playwright with first E2E test

### Week 4: Polish + Production Readiness
- [ ] Implement all loading/error/empty states
- [ ] Add toast notification system (Sonner)
- [ ] Wire up background jobs for async work (email, etc.)
- [ ] Configure Vercel preview deployments + branch databases
- [ ] Run Playwright E2E against preview URL in CI
- [ ] Implement monitoring (uptime, error alerts)
- [ ] Document all environment variables
- [ ] Conduct accessibility audit (`axe-core`)
- [ ] Deploy to production

### Ongoing
- [ ] Run `supabase gen types typescript` after every schema change
- [ ] Add tests for every new feature before merging
- [ ] Update `.cursorrules` as project conventions evolve
- [ ] Review Inngest function logs weekly
- [ ] Review Sentry errors weekly

---

*Last updated: March 2026 | Version 1.0*
*Companion documents: `skills.md` | `tools.md`*
