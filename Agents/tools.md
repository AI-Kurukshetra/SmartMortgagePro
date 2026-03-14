# Tools Reference — AI-Assisted Full-Stack Development
## Next.js + Supabase + Vercel Stack

> Curated catalog of tools, platforms, and libraries that replace manual implementation of common full-stack capabilities. Organized by category with free-tier availability, integration complexity, and recommended use cases for this stack.

---

## Table of Contents

1. [AI Coding Tools](#1-ai-coding-tools)
2. [UI Generation Tools](#2-ui-generation-tools)
3. [Database Automation Tools](#3-database-automation-tools)
4. [Workflow & Background Job Tools](#4-workflow--background-job-tools)
5. [Document Processing Platforms](#5-document-processing-platforms)
6. [Testing Tools](#6-testing-tools)
7. [Observability Tools](#7-observability-tools)
8. [DevOps & Deployment Tools](#8-devops--deployment-tools)
9. [Core Library Stack](#9-core-library-stack)
10. [Build vs. Leverage Decision Framework](#10-build-vs-leverage-decision-framework)

---

## 1. AI Coding Tools

### Cursor
| Property | Value |
|---|---|
| **Category** | AI-native IDE |
| **Free Tier** | Yes (limited generations) |
| **API Available** | No (IDE tool) |
| **Integration Complexity** | Very Low — install and use |
| **Best For** | Developer-in-the-loop AI coding, codebase-aware generation |

**What it does:** VS Code fork with deep AI integration. Agent mode navigates, edits, and runs code across the full project. Understands file structure via indexing.

**Use in this stack:**
- `.cursorrules` file encodes project conventions (naming, Supabase client usage, component patterns)
- Agent mode generates full features from a spec comment
- Connects to Supabase MCP server for schema-aware query generation
- Auto-imports, auto-types, and follows existing patterns in the codebase

**Why use over manual:** Eliminates "write boilerplate from scratch" — agents write the first 80%, developer refines the remaining 20%.

---

### Claude Code (Anthropic)
| Property | Value |
|---|---|
| **Category** | CLI agentic coding agent |
| **Free Tier** | Pay-per-use (Anthropic API) |
| **API Available** | CLI tool (`npx claude-code`) |
| **Integration Complexity** | Very Low |
| **Best For** | Autonomous multi-file feature generation, codebase-wide refactoring |

**What it does:** Official Anthropic CLI coding agent. Understands the full project, autonomously implements features across multiple files, runs commands, and iterates until the task is complete.

**Use in this stack:**
- `claude "Add an org-scoped RLS policy to the tasks table and update the API route"` — executes end-to-end
- Reads existing patterns before generating to stay consistent
- Can be called in CI pipelines for automated code tasks

---

### Aider
| Property | Value |
|---|---|
| **Category** | CLI AI coding assistant |
| **Free Tier** | Open-source (bring your own API key) |
| **API Available** | CLI (scriptable) |
| **Integration Complexity** | Low — pip install |
| **Best For** | Surgical file edits, minimal-diff changes, CI automation |

**What it does:** Terminal-based AI coding tool that makes targeted edits to specified files and commits with descriptive messages. Produces small, reviewable diffs.

**Use in this stack:**
```bash
aider --model claude-sonnet-4-6 \
  --message "Add RLS policy for user_profiles. Users see only their own row." \
  supabase/migrations/ types/database.types.ts
```

**Why use:** Best for automated code modification tasks where you want minimal diff and auto-commit.

---

### GitHub Copilot
| Property | Value |
|---|---|
| **Category** | In-editor AI assistant + Workspace agent |
| **Free Tier** | Yes (limited, GitHub account required) |
| **API Available** | No (IDE extension) |
| **Integration Complexity** | Very Low |
| **Best For** | Inline code completion, test generation, PR descriptions |

**What it does:** Inline suggestions in VS Code/JetBrains. Copilot Workspace can plan and generate code from GitHub Issues.

**Use in this stack:** Test generation, boilerplate completion, PR description generation from diffs.

---

## 2. UI Generation Tools

### v0 by Vercel ⭐ Primary Recommendation
| Property | Value |
|---|---|
| **Category** | AI UI component generator |
| **Free Tier** | Yes (limited generations/month) |
| **API Available** | Yes (v0 API — beta) |
| **Integration Complexity** | Very Low — copy/paste or API call |
| **Best For** | React component and full-page generation using shadcn/ui + Tailwind |

**What it does:** Generates production-ready React components from text descriptions. Output uses shadcn/ui and Tailwind — immediately compatible with Next.js App Router.

**Use in this stack:**
- Generate initial UI for every new page or feature
- Use v0 API to automate UI generation in a development pipeline
- Iterate interactively in the v0 chat interface
- Generated components drop directly into `components/` with minimal changes

**Ideal workflow:**
1. Describe the component in natural language
2. v0 generates shadcn/ui + Tailwind JSX
3. Copy to project, wire to real data, adjust to match design system
4. Done — no Figma → code translation needed

---

### shadcn/ui
| Property | Value |
|---|---|
| **Category** | Component library (copy/paste, not a package) |
| **Free Tier** | Fully open-source |
| **API Available** | CLI (`npx shadcn-ui@latest add`) |
| **Integration Complexity** | Very Low — first-class Next.js support |
| **Best For** | Design-system-aligned base components with full source ownership |

**What it does:** Installs accessible, themeable Radix UI + Tailwind components directly into `components/ui/`. You own the code — no fighting a package API.

**Use in this stack:** The foundational component library. Every generated UI component builds on shadcn primitives. Theme once via CSS variables; applies everywhere.

---

### Builder.io
| Property | Value |
|---|---|
| **Category** | Visual development + headless CMS |
| **Free Tier** | Yes |
| **API Available** | Yes |
| **Integration Complexity** | Medium |
| **Best For** | Marketing pages, landing pages, non-developer content editing |

**Use in this stack:** Marketing site pages that need to be edited by non-developers without touching code. Not recommended for app UI.

---

## 3. Database Automation Tools

### Supabase CLI ⭐ Primary Recommendation
| Property | Value |
|---|---|
| **Category** | Database management CLI |
| **Free Tier** | Open-source |
| **API Available** | CLI + Management API |
| **Integration Complexity** | Very Low — first-class integration |
| **Best For** | Migrations, type generation, local dev, branching, seeding |

**What it does:** The complete toolchain for Supabase development — local Postgres instance, migration management, type generation, storage emulation, Edge Function deployment.

**Critical commands for AI-assisted development:**
```bash
supabase db diff --file new_feature      # Generate migration from schema diff
supabase gen types typescript            # Regenerate TypeScript types
supabase db push                         # Apply migrations to remote
supabase start                           # Start local stack
supabase db reset                        # Reset + reseed local DB
```

---

### Drizzle ORM (optional alternative)
| Property | Value |
|---|---|
| **Category** | TypeScript ORM + migration tool |
| **Free Tier** | Open-source |
| **API Available** | No (library) |
| **Integration Complexity** | Medium |
| **Best For** | Teams wanting TypeScript-first schema definition + migration generation |

**What it does:** Define schema in TypeScript, auto-generate migrations. Works on top of Supabase's Postgres.

**Use in this stack:** Optional layer on top of Supabase. Adds TypeScript schema definition and `drizzle-kit push` migration. Trade-off: more TypeScript control vs. Supabase dashboard schema visibility.

---

### pgAdmin / TablePlus
| Property | Value |
|---|---|
| **Category** | Database GUI |
| **Free Tier** | pgAdmin free, TablePlus paid (free trial) |
| **Integration Complexity** | Very Low |
| **Best For** | Visual query building, data inspection, manual migration verification |

**Use in this stack:** Supplement to Supabase Studio for complex query analysis and `EXPLAIN ANALYZE` visualization.

---

## 4. Workflow & Background Job Tools

### Inngest ⭐ Primary Recommendation
| Property | Value |
|---|---|
| **Category** | Durable workflow / background jobs |
| **Free Tier** | Yes — 50K function runs/month |
| **API Available** | Yes |
| **Integration Complexity** | Very Low — native Vercel + Next.js integration |
| **Best For** | Background jobs, event-driven workflows, scheduled tasks, retries |

**What it does:** Durable serverless functions with built-in retry, scheduling, event fan-out, step-level persistence. Designed for Vercel + Next.js.

**Use in this stack:**
```typescript
// One route handler, one function file — that's the full setup
// app/api/inngest/route.ts + inngest/functions/send-welcome-email.ts

export const sendWelcomeEmail = inngest.createFunction(
  { id: 'send-welcome-email', retries: 3 },
  { event: 'user/signed-up' },
  async ({ event, step }) => {
    await step.run('send-email', () => resend.sendWelcomeEmail(event.data.user));
    await step.sleep('wait-3-days', '3 days');
    await step.run('send-followup', () => resend.sendFollowUp(event.data.user));
  }
);
```

**Why use over manual queues:** No Redis, no Bull, no custom retry logic. Runs on Vercel serverless without infrastructure.

---

### Trigger.dev
| Property | Value |
|---|---|
| **Category** | Background jobs / durable workflows |
| **Free Tier** | Yes (open-source, self-hostable) |
| **API Available** | Yes |
| **Integration Complexity** | Low — designed for Next.js |
| **Best For** | Teams wanting self-hosted alternative to Inngest |

**When to choose over Inngest:** If you need full self-hosting and zero vendor dependency. Very similar DX to Inngest.

---

### Supabase Edge Functions
| Property | Value |
|---|---|
| **Category** | Serverless functions (Deno runtime) |
| **Free Tier** | Yes — 500K invocations/month |
| **API Available** | Yes |
| **Integration Complexity** | Low — managed by Supabase CLI |
| **Best For** | Database-triggered processing, lightweight webhooks, storage event handlers |

**Use in this stack:** Document ingestion triggered on file upload, lightweight webhook processing, data transformation triggered by DB changes.

---

## 5. Document Processing Platforms

### LlamaParse (LlamaCloud) ⭐ Primary Recommendation
| Property | Value |
|---|---|
| **Category** | Intelligent document parser |
| **Free Tier** | Yes — 1000 pages/day free |
| **API Available** | Yes |
| **Integration Complexity** | Low |
| **Best For** | PDF, DOCX, XLSX parsing with table and layout preservation for RAG |

**What it does:** State-of-the-art document parser producing Markdown output with accurate table, header, and multi-column extraction. Designed for LLM/RAG pipelines.

**Use in this stack:**
```typescript
// In a Supabase Edge Function
const parser = new LlamaParseClient({ apiKey: Deno.env.get('LLAMA_CLOUD_KEY') });
const [doc] = await parser.loadData(fileBuffer, { resultType: 'markdown' });
// Clean Markdown → chunk → embed → store in pgvector
```

**Why use:** Best PDF quality for RAG use cases. Free tier covers most indie project volumes.

---

### Unstructured.io
| Property | Value |
|---|---|
| **Category** | Document ingestion pipeline |
| **Free Tier** | Open-source (self-hostable) |
| **API Available** | Yes |
| **Integration Complexity** | Medium |
| **Best For** | High-volume document processing, 20+ file type support, self-hosted |

**When to choose:** Volume exceeds LlamaParse free tier and you want to avoid per-page costs. Self-host on a VPS.

---

### Voyage AI
| Property | Value |
|---|---|
| **Category** | Embedding model API |
| **Free Tier** | Yes — 200M tokens free |
| **API Available** | Yes |
| **Integration Complexity** | Very Low |
| **Best For** | High-quality code and document embeddings for semantic search |

**Use in this stack:** `voyage-3` for document embeddings, `voyage-code-3` for codebase indexing. Outperforms OpenAI `text-embedding-3-small` on retrieval benchmarks.

---

### Supabase pgvector
| Property | Value |
|---|---|
| **Category** | Vector database (built into Supabase) |
| **Free Tier** | Yes — included in Supabase free tier |
| **API Available** | Yes (Supabase JS client) |
| **Integration Complexity** | Very Low — already in the stack |
| **Best For** | Embedding storage and semantic search without additional infrastructure |

**Use in this stack:**
```sql
create extension if not exists vector;
create table document_embeddings (
  id uuid primary key default gen_random_uuid(),
  content text,
  embedding vector(1024),
  metadata jsonb
);
create index on document_embeddings using hnsw (embedding vector_cosine_ops);
```
```typescript
// Semantic search
const { data } = await supabase.rpc('match_documents', {
  query_embedding: queryVector,
  match_threshold: 0.7,
  match_count: 5,
});
```

**Why use:** Already in your stack. No Pinecone, Weaviate, or Qdrant needed at most project scales.

---

## 6. Testing Tools

### Vitest ⭐ Unit & Integration Tests
| Property | Value |
|---|---|
| **Free Tier** | Open-source |
| **Integration Complexity** | Very Low |
| **Best For** | Unit tests, integration tests, component tests |

Fast, Vite-native test runner. Compatible with Jest syntax. First choice for all non-E2E tests.

---

### Playwright ⭐ E2E Tests
| Property | Value |
|---|---|
| **Free Tier** | Open-source (Microsoft) |
| **Integration Complexity** | Low |
| **Best For** | E2E user flow testing, visual regression, browser automation |

**Use in this stack:** E2E tests run against Vercel preview URLs in CI. Page Object Model keeps tests maintainable.

---

### React Testing Library
| Property | Value |
|---|---|
| **Free Tier** | Open-source |
| **Integration Complexity** | Very Low |
| **Best For** | Component testing from the user's perspective |

Used with Vitest for component-level tests.

---

### PromptFoo
| Property | Value |
|---|---|
| **Category** | LLM output evaluation |
| **Free Tier** | Open-source |
| **API Available** | CLI + API |
| **Integration Complexity** | Low |
| **Best For** | Testing AI-generated outputs, regression testing agent prompts |

**Use in this stack:** If you build RAG or AI features, PromptFoo validates that responses meet quality thresholds before merging prompt changes.

---

### Bruno
| Property | Value |
|---|---|
| **Category** | Open-source API client |
| **Free Tier** | Fully open-source |
| **Integration Complexity** | Very Low |
| **Best For** | API documentation, manual testing, CI API validation |

**Why Bruno over Postman:** Open-source, collections stored as files in the repo (version controlled), no cloud account required.

---

## 7. Observability Tools

### Langfuse ⭐ AI Feature Observability
| Property | Value |
|---|---|
| **Category** | LLM trace logging + eval platform |
| **Free Tier** | Open-source (self-hosted) + managed free tier |
| **API Available** | Yes |
| **Integration Complexity** | Low |
| **Best For** | Tracing LLM calls, prompt management, cost tracking for AI features |

**Use in this stack:** Wrap every Claude API call to capture prompt, completion, token usage, and cost. Essential for debugging RAG pipelines and AI features.

---

### Sentry ⭐ Error Monitoring
| Property | Value |
|---|---|
| **Free Tier** | Yes — 5K errors/month |
| **Integration Complexity** | Very Low — Next.js SDK |
| **Best For** | Frontend and API error capture with stack traces and source maps |

---

### Vercel Analytics
| Property | Value |
|---|---|
| **Free Tier** | Yes |
| **Integration Complexity** | Very Low — one script tag |
| **Best For** | Core Web Vitals, page view tracking, performance monitoring |

---

### BetterStack (formerly Logtail)
| Property | Value |
|---|---|
| **Free Tier** | Yes |
| **Integration Complexity** | Low |
| **Best For** | Uptime monitoring, structured log ingestion, on-call alerts |

---

## 8. DevOps & Deployment Tools

### GitHub Actions ⭐ CI/CD
| Property | Value |
|---|---|
| **Free Tier** | Yes — 2000 min/month private, unlimited public |
| **Integration Complexity** | Low |
| **Best For** | CI/CD pipelines, automated testing, deployment triggers |

The default CI/CD choice for this stack. Tight GitHub + Vercel + Supabase integration.

---

### Vercel ⭐ Deployment
| Property | Value |
|---|---|
| **Free Tier** | Yes — generous hobby tier |
| **Integration Complexity** | Very Low |
| **Best For** | Next.js deployment, preview environments, edge functions |

Native Next.js deployment platform. Preview deployments on every PR — no configuration needed.

---

### @t3-oss/env-nextjs
| Property | Value |
|---|---|
| **Free Tier** | Open-source |
| **Integration Complexity** | Very Low |
| **Best For** | Type-safe, Zod-validated environment variables in Next.js |

Validates all env vars at build time. Build fails if a required variable is missing or malformed.

---

## 9. Core Library Stack

This is the recommended baseline library set for a Next.js + Supabase project. Every library here has a free tier (or is open-source) and integrates cleanly with this stack.

| Library | Purpose | Category |
|---|---|---|
| `@supabase/ssr` | Server-side Supabase Auth (Next.js App Router) | Auth |
| `@supabase/supabase-js` | Supabase client | Database / Storage / Realtime |
| `zod` | Schema validation | Validation |
| `react-hook-form` | Form state management | Forms |
| `@hookform/resolvers` | Zod → react-hook-form bridge | Forms |
| `@tanstack/react-query` | Server state management | Data fetching |
| `zustand` | Global client state | State |
| `nuqs` | Type-safe URL search params | State |
| `framer-motion` | Animations and transitions | UI |
| `sonner` | Toast notifications | UI |
| `recharts` | Charts and data visualization | UI |
| `@faker-js/faker` | Realistic test data generation | Testing |
| `papaparse` | CSV parsing | Data |
| `xlsx` | Excel file parsing | Data |
| `ai` (Vercel AI SDK) | LLM streaming + structured output | AI |
| `inngest` | Background jobs and workflows | Backend |
| `@t3-oss/env-nextjs` | Type-safe environment variables | Config |

All are: open-source or free-tier, TypeScript-native, and compatible with Next.js App Router.

---

## 10. Build vs. Leverage Decision Framework

### The Core Question
> Should I build this from scratch, use a SaaS tool, or use an open-source library?

---

### Decision Matrix

| Capability | Recommendation | Tool | Reason |
|---|---|---|---|
| Vector database | **Use what's there** | Supabase pgvector | Already in stack, free, sufficient for most scales |
| Document parsing | **SaaS** | LlamaParse | 1000 pages/day free — not worth building |
| Embeddings | **SaaS** | Voyage AI | 200M free tokens — not worth building |
| Background jobs | **SaaS** | Inngest | Durable execution is hard; free tier is generous |
| UI components | **Open-source** | shadcn/ui | Own the code, zero lock-in |
| UI generation | **SaaS** | v0 by Vercel | Generates better UI faster than building from scratch |
| Auth | **SaaS** | Supabase Auth | Already in stack; don't build auth |
| Error monitoring | **SaaS** | Sentry | Free tier; integration is 5 minutes |
| Type-safe env vars | **Open-source** | @t3-oss/env-nextjs | 30-minute setup, prevents env bugs forever |
| Migration generation | **Open-source + CLI** | Supabase CLI | `supabase db diff` handles this |
| Form validation | **Open-source** | Zod + React Hook Form | Standard; no reason to build |
| E2E testing | **Open-source** | Playwright | Best-in-class, free, Microsoft-maintained |
| API testing | **Open-source** | Bruno | Version-controlled, no cloud needed |
| RBAC | **Build** | Custom `lib/auth/` | Specific to your data model; 1–2 hour build |
| Business logic | **Build** | Custom `lib/services/` | Specific to your domain; cannot be replaced by a tool |
| Semantic search function | **Build** | pgvector SQL function | 30-line SQL function; no additional service needed |

---

### Rule 1: Never Build Commodity Infrastructure

If it's not specific to your business domain, use a tool.

**Things to never build manually:**
- Auth (Supabase Auth)
- Background job queue (Inngest)
- Vector database (pgvector)
- Document parsing (LlamaParse)
- Error monitoring (Sentry)
- Deployment (Vercel)

---

### Rule 2: Build When it's Your Differentiation

If it encodes your business rules, your data model, or your user experience — build it.

**Things to build:**
- Your permission system (`lib/auth/permissions.ts`)
- Your business logic (`lib/services/`)
- Your data model (Postgres schema)
- Your UI components (on top of shadcn primitives)
- Your agent prompts and RAG pipeline logic

---

### Rule 3: The "Free Tier Covers You" Rule

If a SaaS tool's free tier covers your current scale (and the next 12 months), use it. Migrate later if you outgrow it.

| Tool | Free tier capacity | When to upgrade |
|---|---|---|
| Supabase | 500MB DB, 1GB storage, 50K MAUs | When you hit 50K users |
| Inngest | 50K function runs/month | When you run 50K+ background jobs/month |
| LlamaParse | 1000 pages/day | When you process > 1000 pages/day |
| Sentry | 5K errors/month | When you hit 5K errors/month (fix bugs first) |
| Vercel | 100GB bandwidth, unlimited previews | When you need team features or high bandwidth |
| Voyage AI | 200M embedding tokens | When you've indexed millions of documents |

---

### Rule 4: Prefer Open-Source for Libraries, SaaS for Services

- **Libraries** (run in your process): prefer open-source — you own the code, zero vendor lock-in, no network call
- **Services** (external API call): SaaS is fine — they maintain the infrastructure, you just call the API

| Type | Examples | Prefer |
|---|---|---|
| Library | Zod, React Hook Form, Faker, Papaparse | Open-source |
| Service | Document parsing, email sending, error monitoring | SaaS (free tier) |
| Hybrid | Langfuse, Trigger.dev | Open-source if self-hosting; SaaS if managed |

---

### Anti-Patterns to Avoid

| Anti-Pattern | Cost | Better Approach |
|---|---|---|
| Building a custom job queue | Weeks of engineering; operational burden | Inngest free tier |
| Choosing Pinecone before trying pgvector | $70+/month; extra service to manage | pgvector is free, already in stack |
| Writing custom auth from scratch | Months of work; security risks | Supabase Auth |
| Manual PDF parsing with PDFLib | Poor quality for LLM use cases | LlamaParse free tier |
| Hardcoding env vars | Build fails in production silently | @t3-oss/env-nextjs |
| Skipping type generation | Runtime errors that TypeScript would catch | `supabase gen types typescript` post-migration |

---

*Last updated: March 2026 | Version 1.0*
*Companion documents: `skills.md` | `architecture.md`*
