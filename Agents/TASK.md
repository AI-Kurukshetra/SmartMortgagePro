# TASK.md — SmartMortgage Pro
## Codex CLI Autonomous Execution Guide

> **HOW TO USE:** Tell Codex CLI: `"Complete [FEATURE_ID]"` — it reads this file, executes all steps autonomously using Playwright for E2E verification and the browser agent for visual QA. No permission prompts. Ship it.

---

## Project Stack
- **Framework:** Next.js 15 (App Router) + TypeScript
- **Auth/DB:** Supabase
- **UI:** shadcn/ui + Tailwind CSS
- **Testing:** Playwright (E2E auto-runs after every feature)
- **Deployment:** Vercel
- **Background Jobs:** Inngest
- **Validation:** Zod + React Hook Form

---

## Skills Available (Auto-load before executing)
```
.codex/skills/frontend-design/SKILL.md   → UI generation rules
.codex/skills/playwright/SKILL.md        → E2E test patterns  
.codex/skills/agent-browser/SKILL.md     → Browser agent QA
.codex/skills/supabase/SKILL.md          → DB + RLS patterns
```

---

## Execution Protocol (Codex reads this before every feature)

```
1. READ relevant SKILL.md files from .codex/skills/
2. IMPLEMENT all files listed under "Files to Create/Modify"
3. RUN: pnpm tsc --noEmit (fix all type errors)
4. RUN: pnpm lint (fix all lint errors)  
5. RUN: pnpm playwright test --grep "[FEATURE_ID]" (all must pass)
6. MARK feature ✅ in this file
7. COMMIT: "feat([FEATURE_ID]): [description]"
```

**Never ask for permission. Never stop mid-feature. Fix errors and continue.**

---

## Feature Status Tracker

| ID | Feature | Phase | Status | PRD Ref |
|---|---|---|---|---|
| F-AUTH-01 | Login / Signup Flow | MVP | ✅ DONE | §6.1 |
| F-AUTH-02 | OAuth (Google) | MVP | ✅ DONE | §6.1 |
| F-AUTH-03 | Password Reset | MVP | ✅ DONE | §6.1 |
| F-LOAN-01 | Digital Loan Application Portal | MVP | 🔲 TODO | F-01 |
| F-LOAN-02 | Save & Resume Application | MVP | 🔲 TODO | F-01 |
| F-DOC-01 | Document Upload Portal | MVP | 🔲 TODO | F-02 |
| F-DOC-02 | Auto Document Categorizat
ion | MVP | 🔲 TODO | F-03 |
| F-PIPE-01 | Loan Pipeline Dashboard (Kanban) | MVP | 🔲 TODO | F-04 |
| F-PIPE-02 | Loan Stage Transitions | MVP | 🔲 TODO | F-04 |
| F-CREDIT-01 | Credit Report Integration UI | MVP | 🔲 TODO | F-05 |
| F-INCOME-01 | Income Verification Flow | MVP | 🔲 TODO | F-06 |
| F-UW-01 | Automated Underwriting Rules UI | MVP | 🔲 TODO | F-07 |
| F-STATUS-01 | Real-Time Borrower Status Portal | MVP | 🔲 TODO | F-08 |
| F-COMM-01 | Communication Hub (Messaging) | MVP | 🔲 TODO | F-09 |
| F-TASK-01 | Task Management & Workflows | MVP | 🔲 TODO | F-10 |
| F-COMP-01 | Compliance Management Dashboard | MVP | 🔲 TODO | F-11 |
| F-ESIGN-01 | E-Signature Workflow | MVP | 🔲 TODO | F-12 |
| F-PRICE-01 | Loan Pricing Engine UI | MVP | 🔲 TODO | F-13 |
| F-3P-01 | Third-Party Service Ordering | MVP | 🔲 TODO | F-14 |
| F-DISC-01 | Automated Disclosure Generation | MVP | 🔲 TODO | F-19 |

---

---

# ═══════════════════════════════════════════
# FEATURE: F-AUTH-01 — Login / Signup Flow
# ═══════════════════════════════════════════

**PRD Reference:** §6.1 (Authentication), Architecture §5  
**Phase:** MVP — Complete First  
**Skill Files:** `.codex/skills/frontend-design/SKILL.md`, `.codex/skills/supabase/SKILL.md`

## Design Reference
Match the attached `login-reference.png` exactly:
- Split layout: Left panel (light blue `#EEF2FF`, branded illustration + tagline) / Right panel (white, form)
- Left: dot-grid background, line chart SVG illustration, circular arrow button (blue `#3B4FE4`), app name bold blue, subtitle gray
- Right: "Welcome back" H1 bold dark, subtitle gray, Google OAuth button (outlined), `or` divider, email + password fields (light gray bg `#F5F6FA`, rounded-lg), password toggle eye icon, Sign in CTA (blue filled full-width), Forgot password link (blue text)
- Overall card: rounded-2xl, white shadow on light blue page bg
- **For signup page:** Mirror layout, swap right panel to signup fields (Full Name, Email, Password, Confirm Password) + "Already have an account? Sign in" link

## Database Setup

```sql
-- supabase/migrations/001_auth_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'borrower' check (role in ('borrower','loan_officer','processor','underwriter','admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Files to Create/Modify

```
app/
├── (auth)/
│   ├── layout.tsx                          [CREATE]
│   ├── login/
│   │   └── page.tsx                        [CREATE]
│   └── signup/
│       └── page.tsx                        [CREATE]
├── auth/
│   └── callback/
│       └── route.ts                        [CREATE]
middleware.ts                               [CREATE]
lib/
├── supabase/
│   ├── client.ts                           [CREATE]
│   ├── server.ts                           [CREATE]
│   └── admin.ts                            [CREATE]
lib/validations/
│   └── auth.ts                             [CREATE]
actions/
│   └── auth.ts                             [CREATE]
components/
│   └── auth/
│       ├── login-form.tsx                  [CREATE]
│       ├── signup-form.tsx                 [CREATE]
│       ├── google-oauth-button.tsx         [CREATE]
│       └── auth-left-panel.tsx             [CREATE]
supabase/
│   └── migrations/
│       └── 001_auth_profiles.sql           [CREATE]
```

## Implementation Spec

### `lib/validations/auth.ts`
```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const SignupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

export type LoginInput = z.infer<typeof LoginSchema>
export type SignupInput = z.infer<typeof SignupSchema>
```

### `actions/auth.ts`
```typescript
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { LoginSchema, SignupSchema } from '@/lib/validations/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = LoginSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signupAction(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = SignupSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = createServerClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name } },
  })
  if (error) return { error: { _form: [error.message] } }

  redirect('/auth/verify-email')
}

export async function signOutAction() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function googleOAuthAction() {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}
```

### `middleware.ts`
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/signup', '/auth/callback', '/auth/verify-email', '/forgot-password']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookiesToSet) => { cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isPublic = PUBLIC_ROUTES.some(r => request.nextUrl.pathname.startsWith(r))

  if (!user && !isPublic) return NextResponse.redirect(new URL('/login', request.url))
  if (user && isPublic && request.nextUrl.pathname !== '/auth/callback') return NextResponse.redirect(new URL('/dashboard', request.url))

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'] }
```

### UI Pixel Spec (`components/auth/auth-left-panel.tsx`)
- Background: `#EEF2FF`
- Dot grid: CSS radial-gradient dots, 20px spacing, `#C7D2FE` dots
- Line chart: SVG `<polyline>` with nodes, stroke `#3B4FE4`, fill none
- Circular button: `w-14 h-14 rounded-full bg-[#3B4FE4]` with `→` arrow white
- Brand name: `text-3xl font-extrabold text-[#3B4FE4]`
- Subtitle: `text-sm text-gray-500 text-center max-w-[260px]`

### UI Pixel Spec (Right Panel `components/auth/login-form.tsx`)
- Container: `p-12 flex flex-col gap-6`
- "Welcome back": `text-4xl font-bold text-gray-900`
- Google button: `border border-gray-200 rounded-xl h-14 flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-50`
- Divider: flex line + "or" + flex line with `text-gray-400 text-sm`
- Inputs: `bg-[#F5F6FA] border-0 rounded-xl h-12 px-4 text-gray-900 placeholder-gray-400`
- Labels: `text-sm font-medium text-gray-700` with red `*` for required
- Sign in CTA: `bg-[#3B4FE4] hover:bg-[#2D3FD4] text-white h-14 rounded-xl font-semibold text-base flex items-center justify-center gap-2`
- Forgot password: `text-[#3B4FE4] text-sm text-center hover:underline`
- Password field: relative wrapper, eye toggle button absolute right-4

## Playwright E2E Tests

```typescript
// e2e/flows/auth.spec.ts

test.describe('F-AUTH-01: Login/Signup Flow', () => {

  test('renders login page with correct layout', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Travel Connect')).toBeVisible()  // or app brand name
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Login with Google')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
    await expect(page.locator('text=Forgot password?')).toBeVisible()
  })

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Sign in")')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('shows validation errors for invalid email', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button:has-text("Sign in")')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
  })

  test('password toggle shows/hides password', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input[name="password"]')
    const toggleBtn = page.locator('[data-testid="password-toggle"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('navigates to signup page', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/signup')
    await expect(page.locator('text=Create your account')).toBeVisible()
  })

  test('signup shows confirm password mismatch error', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('input[name="full_name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirm_password"]', 'password456')
    await page.click('button:has-text("Create account")')
    await expect(page.locator('text=Passwords don\'t match')).toBeVisible()
  })

  test('unauthenticated user redirected from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('authenticated user redirected from /login to /dashboard', async ({ page, context }) => {
    // Use storage state with seeded test user
    await context.storageState({ path: 'e2e/fixtures/auth.json' })
    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
  })

})
```

## Acceptance Criteria Checklist
- [ ] Login page renders split layout matching design reference
- [ ] All form validations fire client-side (no network call for empty fields)
- [ ] Google OAuth button redirects to Supabase OAuth flow
- [ ] Successful login redirects to `/dashboard`
- [ ] Failed login shows error message inline (not alert())
- [ ] Password show/hide toggle works
- [ ] Signup page with name + email + password + confirm password
- [ ] Profile auto-created via DB trigger on signup
- [ ] Middleware redirects unauthenticated users from `/dashboard` → `/login`
- [ ] Middleware redirects authenticated users from `/login` → `/dashboard`
- [ ] All Playwright tests pass: `pnpm playwright test --grep "F-AUTH-01"`
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] `pnpm lint` passes

---

---

# ═══════════════════════════════════════════
# FEATURE: F-AUTH-02 — OAuth (Google)
# ═══════════════════════════════════════════

**PRD Reference:** §6.1, Architecture §5  
**Phase:** MVP  
**Depends on:** F-AUTH-01 ✅

## Files to Create/Modify
```
app/auth/callback/route.ts          [CREATE]
components/auth/google-oauth-button.tsx  [CREATE — extract from F-AUTH-01]
```

## Implementation Spec

### `app/auth/callback/route.ts`
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_callback_failed`)
}
```

## Playwright E2E Tests
```typescript
test.describe('F-AUTH-02: Google OAuth', () => {
  test('Google OAuth button exists and is clickable', async ({ page }) => {
    await page.goto('/login')
    const googleBtn = page.locator('button:has-text("Login with Google")')
    await expect(googleBtn).toBeVisible()
    await expect(googleBtn).toBeEnabled()
  })

  test('auth callback route exists', async ({ page }) => {
    const response = await page.request.get('/auth/callback')
    // Should redirect, not 404
    expect(response.status()).not.toBe(404)
  })
})
```

## Acceptance Criteria
- [ ] Google OAuth button triggers Supabase OAuth redirect
- [ ] `/auth/callback` exchanges code for session and redirects to `/dashboard`
- [ ] Failed OAuth shows error on login page
- [ ] Profile created on first OAuth login via DB trigger

---

---

# ═══════════════════════════════════════════
# FEATURE: F-AUTH-03 — Password Reset
# ═══════════════════════════════════════════

**PRD Reference:** §6.1  
**Phase:** MVP  
**Depends on:** F-AUTH-01 ✅

## Files to Create/Modify
```
app/(auth)/forgot-password/page.tsx     [CREATE]
app/(auth)/reset-password/page.tsx      [CREATE]
components/auth/forgot-password-form.tsx [CREATE]
components/auth/reset-password-form.tsx  [CREATE]
actions/auth.ts                          [MODIFY — add resetPassword, updatePassword]
lib/validations/auth.ts                  [MODIFY — add ForgotPasswordSchema, ResetPasswordSchema]
```

## Implementation Spec
- Forgot password page: single email field, submit calls `supabase.auth.resetPasswordForEmail()`
- Reset password page (reached via email link): new password + confirm, calls `supabase.auth.updateUser({ password })`
- Both pages use same `auth-left-panel` from F-AUTH-01

## Playwright E2E Tests
```typescript
test.describe('F-AUTH-03: Password Reset', () => {
  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button:has-text("Send reset link")')).toBeVisible()
  })

  test('forgot password validates email', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.click('button:has-text("Send reset link")')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
  })

  test('forgot password shows success state after submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button:has-text("Send reset link")')
    await expect(page.locator('text=Check your email')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Forgot password page accessible from login page link
- [ ] Email validation before submission
- [ ] Success state shown after email sent
- [ ] Reset password page validates new password ≥ 8 chars
- [ ] Passwords match validation on reset form
- [ ] After reset, user redirected to login with success message

---

---

# ═══════════════════════════════════════════
# FEATURE: F-LOAN-01 — Digital Loan Application Portal
# ═══════════════════════════════════════════

**PRD Reference:** F-01, §6.1  
**Phase:** MVP  
**Depends on:** F-AUTH-01 ✅

## Database Setup
```sql
-- supabase/migrations/002_loans.sql
create type loan_type as enum ('purchase', 'refinance', 'heloc', 'fha', 'va');
create type loan_status as enum ('draft', 'submitted', 'processing', 'underwriting', 'approved', 'denied', 'closed');
create type employment_type as enum ('employed', 'self_employed', 'retired', 'other');

create table loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references auth.users(id),
  loan_officer_id uuid references auth.users(id),
  loan_type loan_type not null default 'purchase',
  status loan_status not null default 'draft',
  -- Property
  property_address text,
  property_city text,
  property_state text,
  property_zip text,
  property_type text,
  purchase_price numeric(12,2),
  down_payment numeric(12,2),
  loan_amount numeric(12,2),
  -- Borrower
  first_name text,
  last_name text,
  email text,
  phone text,
  ssn_last4 text,
  date_of_birth date,
  -- Employment
  employment_type employment_type,
  employer_name text,
  job_title text,
  years_employed numeric(4,1),
  annual_income numeric(12,2),
  -- Step tracking
  current_step int not null default 1,
  completed_steps int[] not null default '{}',
  -- Meta
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table loans enable row level security;

create policy "Borrowers see own loans"
  on loans for select using (borrower_id = auth.uid());

create policy "Borrowers create loans"
  on loans for insert with check (borrower_id = auth.uid());

create policy "Borrowers update own draft loans"
  on loans for update using (borrower_id = auth.uid() and status = 'draft');
```

## Files to Create/Modify
```
app/(app)/apply/
├── page.tsx                           [CREATE — redirects to step 1]
├── [step]/page.tsx                    [CREATE — dynamic step router]
└── layout.tsx                         [CREATE — progress bar header]
components/loan-application/
├── step-progress.tsx                  [CREATE]
├── step-personal-info.tsx             [CREATE]  ← Step 1
├── step-property.tsx                  [CREATE]  ← Step 2
├── step-employment.tsx                [CREATE]  ← Step 3
├── step-income.tsx                    [CREATE]  ← Step 4
├── step-review.tsx                    [CREATE]  ← Step 5
└── application-layout.tsx             [CREATE]
lib/validations/loan-application.ts    [CREATE]
actions/loans.ts                       [CREATE]
hooks/use-loan-application.ts          [CREATE]
```

## Steps Definition
```
Step 1: Personal Information (name, DOB, SSN last 4, contact)
Step 2: Property Details (address, type, purchase price, down payment)
Step 3: Employment (type, employer, title, years)
Step 4: Income (annual income, other income sources)
Step 5: Review & Submit (summary of all steps, URLA agreement checkbox)
```

## Playwright E2E Tests
```typescript
test.describe('F-LOAN-01: Loan Application', () => {
  test.beforeEach(async ({ page }) => { /* login with test borrower */ })

  test('loan application starts at step 1', async ({ page }) => {
    await page.goto('/apply')
    await expect(page).toHaveURL('/apply/1')
    await expect(page.locator('text=Personal Information')).toBeVisible()
    await expect(page.locator('[data-testid="step-progress"]')).toBeVisible()
  })

  test('step 1 validates required fields', async ({ page }) => {
    await page.goto('/apply/1')
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=First name is required')).toBeVisible()
  })

  test('can navigate forward through steps', async ({ page }) => {
    await page.goto('/apply/1')
    await page.fill('input[name="first_name"]', 'John')
    await page.fill('input[name="last_name"]', 'Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '5551234567')
    await page.click('button:has-text("Next")')
    await expect(page).toHaveURL('/apply/2')
    await expect(page.locator('text=Property Details')).toBeVisible()
  })

  test('can save and resume application', async ({ page }) => {
    await page.goto('/apply/2')
    await page.fill('input[name="property_address"]', '123 Main St')
    await page.click('button:has-text("Save & Exit")')
    await page.goto('/apply')
    // Should resume at step 2
    await expect(page).toHaveURL('/apply/2')
  })

  test('review step shows all entered data', async ({ page }) => {
    // Fill all steps then verify review
    await page.goto('/apply/5')
    await expect(page.locator('[data-testid="review-summary"]')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Multi-step form with progress indicator matching step count
- [ ] Each step validates before advancing
- [ ] Back navigation preserves entered data
- [ ] Auto-save on step completion (loan row persisted as draft)
- [ ] Resume capability — returning borrower continues from last step
- [ ] Review step shows all data with edit links per section
- [ ] Submit creates loan with status `submitted` and redirects to status portal
- [ ] All Playwright tests pass

---

---

# ═══════════════════════════════════════════
# FEATURE: F-DOC-01 — Document Upload Portal
# ═══════════════════════════════════════════

**PRD Reference:** F-02  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅

## Database Setup
```sql
-- supabase/migrations/003_documents.sql
create type doc_category as enum (
  'pay_stub', 'w2', 'bank_statement', 'tax_return',
  'id_document', 'employment_letter', 'other'
);
create type doc_status as enum ('pending', 'processing', 'verified', 'rejected', 'expired');

create table documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  category doc_category not null default 'other',
  file_name text not null,
  file_size int not null,
  mime_type text not null,
  storage_path text not null,
  status doc_status not null default 'pending',
  rejection_reason text,
  expires_at date,
  version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Loan parties can view documents"
  on documents for select using (
    loan_id in (select id from loans where borrower_id = auth.uid())
    or uploaded_by = auth.uid()
  );

create policy "Users can upload documents"
  on documents for insert with check (uploaded_by = auth.uid());
```

## Supabase Storage Setup
```sql
-- Storage bucket (run in Supabase dashboard or via CLI)
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

create policy "Authenticated users can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');

create policy "Users can read own documents"  
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
```

## Files to Create/Modify
```
app/(app)/loans/[loanId]/documents/
├── page.tsx                           [CREATE]
components/documents/
├── document-upload-zone.tsx           [CREATE — drag & drop]
├── document-checklist.tsx             [CREATE]
├── document-card.tsx                  [CREATE]
├── document-category-badge.tsx        [CREATE]
└── upload-progress.tsx                [CREATE]
actions/documents.ts                   [CREATE]
lib/services/documents.ts              [CREATE]
hooks/use-documents.ts                 [CREATE]
```

## Playwright E2E Tests
```typescript
test.describe('F-DOC-01: Document Upload', () => {
  test('document portal shows checklist', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/documents')
    await expect(page.locator('[data-testid="document-checklist"]')).toBeVisible()
    await expect(page.locator('text=Pay Stub')).toBeVisible()
    await expect(page.locator('text=W-2')).toBeVisible()
  })

  test('drag and drop zone is visible', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/documents')
    await expect(page.locator('[data-testid="upload-dropzone"]')).toBeVisible()
    await expect(page.locator('text=Drop files here')).toBeVisible()
  })

  test('file size limit enforced (max 50MB)', async ({ page }) => {
    // Simulate oversized file upload attempt
    await page.goto('/loans/[testLoanId]/documents')
    // Upload a mock file > 50MB and verify error
    await expect(page.locator('text=File too large')).toBeVisible()
  })

  test('uploaded document appears in list', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/documents')
    // Upload a small test PDF
    await page.locator('[data-testid="upload-dropzone"]').setInputFiles('e2e/fixtures/test-doc.pdf')
    await expect(page.locator('[data-testid="document-card"]')).toBeVisible()
    await expect(page.locator('text=processing')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Dynamic checklist based on loan type
- [ ] Drag & drop + click-to-browse upload
- [ ] File type validation (PDF, JPG, PNG only)
- [ ] File size validation (max 50MB per file)
- [ ] Upload progress indicator
- [ ] Uploaded docs listed with status badge
- [ ] Expiry alerts for docs > 60 days old
- [ ] Bulk download as ZIP for loan officers

---

---

# ═══════════════════════════════════════════
# FEATURE: F-PIPE-01 — Loan Pipeline Dashboard
# ═══════════════════════════════════════════

**PRD Reference:** F-04  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅  
**Role Access:** loan_officer, processor, underwriter, admin

## Files to Create/Modify
```
app/(app)/dashboard/
├── page.tsx                           [CREATE — server component]
├── loading.tsx                        [CREATE — skeleton]
└── error.tsx                          [CREATE]
components/pipeline/
├── pipeline-kanban.tsx                [CREATE — client component]
├── pipeline-column.tsx                [CREATE]
├── loan-card.tsx                      [CREATE]
├── pipeline-filters.tsx               [CREATE]
├── loan-health-indicator.tsx          [CREATE]
└── pipeline-stats.tsx                 [CREATE — top stat cards]
lib/services/loans.ts                  [CREATE]
hooks/use-pipeline.ts                  [CREATE]
```

## Playwright E2E Tests
```typescript
test.describe('F-PIPE-01: Pipeline Dashboard', () => {
  test('dashboard loads with kanban columns', async ({ page }) => {
    // login as loan_officer
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="pipeline-kanban"]')).toBeVisible()
    await expect(page.locator('text=Application')).toBeVisible()
    await expect(page.locator('text=Processing')).toBeVisible()
    await expect(page.locator('text=Underwriting')).toBeVisible()
    await expect(page.locator('text=Approved')).toBeVisible()
  })

  test('dashboard loads in < 2 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/dashboard')
    await page.waitForSelector('[data-testid="pipeline-kanban"]')
    expect(Date.now() - start).toBeLessThan(2000)
  })

  test('loan card shows health indicators', async ({ page }) => {
    await page.goto('/dashboard')
    const loanCard = page.locator('[data-testid="loan-card"]').first()
    await expect(loanCard.locator('[data-testid="days-in-stage"]')).toBeVisible()
    await expect(loanCard.locator('[data-testid="outstanding-tasks"]')).toBeVisible()
  })

  test('filter by loan officer works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.selectOption('[data-testid="filter-loan-officer"]', 'me')
    // Loan cards should filter
    await expect(page.locator('[data-testid="loan-card"]')).toBeVisible()
  })
})
```

---

---

# ═══════════════════════════════════════════
# FEATURE: F-STATUS-01 — Borrower Status Portal
# ═══════════════════════════════════════════

**PRD Reference:** F-08  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅, F-AUTH-01 ✅

## Files to Create/Modify
```
app/(app)/my-loans/
├── page.tsx                           [CREATE — list all borrower loans]
└── [loanId]/
    ├── page.tsx                       [CREATE — status detail]
    └── loading.tsx                    [CREATE]
components/status/
├── milestone-tracker.tsx              [CREATE — visual progress bar]
├── action-items-list.tsx              [CREATE — outstanding tasks]
├── loan-timeline.tsx                  [CREATE — activity history]
└── estimated-close-date.tsx           [CREATE]
```

## Playwright E2E Tests
```typescript
test.describe('F-STATUS-01: Borrower Status Portal', () => {
  test('borrower sees their loan status', async ({ page }) => {
    // login as borrower
    await page.goto('/my-loans')
    await expect(page.locator('[data-testid="loan-status-card"]')).toBeVisible()
  })

  test('milestone tracker shows current stage highlighted', async ({ page }) => {
    await page.goto('/my-loans/[testLoanId]')
    await expect(page.locator('[data-testid="milestone-tracker"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-milestone"]')).toHaveClass(/active/)
  })

  test('action items shown prominently', async ({ page }) => {
    await page.goto('/my-loans/[testLoanId]')
    await expect(page.locator('[data-testid="action-items"]')).toBeVisible()
  })
})
```

---

---

# ═══════════════════════════════════════════
# FEATURE: F-COMM-01 — Communication Hub
# ═══════════════════════════════════════════

**PRD Reference:** F-09  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅

## Database Setup
```sql
-- supabase/migrations/004_messages.sql
create table messages (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null,
  is_template boolean default false,
  template_type text,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Loan parties can read messages"
  on messages for select using (
    loan_id in (select id from loans where borrower_id = auth.uid() or loan_officer_id = auth.uid())
  );

create policy "Loan parties can send messages"
  on messages for insert with check (sender_id = auth.uid());
```

## Files to Create/Modify
```
app/(app)/loans/[loanId]/messages/
└── page.tsx                           [CREATE]
components/messaging/
├── message-thread.tsx                 [CREATE — real-time via Supabase Realtime]
├── message-bubble.tsx                 [CREATE]
├── message-input.tsx                  [CREATE]
└── message-templates.tsx              [CREATE]
hooks/use-messages.ts                  [CREATE — Supabase Realtime subscription]
actions/messages.ts                    [CREATE]
```

---

---

# ═══════════════════════════════════════════
# FEATURE: F-TASK-01 — Task Management
# ═══════════════════════════════════════════

**PRD Reference:** F-10  
**Phase:** MVP  
**Depends on:** F-PIPE-01 ✅

## Database Setup
```sql
-- supabase/migrations/005_tasks.sql
create type task_status as enum ('pending', 'in_progress', 'completed', 'overdue', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  depends_on uuid references tasks(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

create index idx_tasks_loan_status on tasks (loan_id, status) where deleted_at is null;
create index idx_tasks_assigned_due on tasks (assigned_to, due_date) where deleted_at is null and status != 'completed';
```

---

---

# ═══════════════════════════════════════════
# FEATURE: F-COMP-01 — Compliance Dashboard
# ═══════════════════════════════════════════

**PRD Reference:** F-11  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅

## Database Setup
```sql
-- supabase/migrations/006_compliance.sql
create type compliance_rule as enum ('trid', 'respa', 'hmda', 'ecoa', 'fcra', 'glba', 'state');
create type compliance_severity as enum ('info', 'warning', 'violation');

create table compliance_checks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  rule compliance_rule not null,
  severity compliance_severity not null,
  description text not null,
  deadline timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table compliance_checks enable row level security;
```

---

---

# ═══════════════════════════════════════════
# FEATURE: F-DISC-01 — Disclosure Generation
# ═══════════════════════════════════════════

**PRD Reference:** F-19  
**Phase:** MVP  
**Depends on:** F-LOAN-01 ✅, F-COMP-01 ✅

## Files to Create/Modify
```
app/(app)/loans/[loanId]/disclosures/
└── page.tsx                           [CREATE]
components/disclosures/
├── disclosure-card.tsx                [CREATE]
├── disclosure-timeline.tsx            [CREATE — TRID deadline tracker]
├── fee-comparison.tsx                 [CREATE — LE vs CD tolerance]
└── generate-disclosure-button.tsx     [CREATE]
lib/services/disclosures.ts            [CREATE]
inngest/functions/
└── generate-disclosure.ts             [CREATE — background job]
```

---

---

# ═══════════════════════════════════════════
# GLOBAL APP SHELL — Implement with F-AUTH-01
# ═══════════════════════════════════════════

## Files
```
app/(app)/layout.tsx                   [CREATE]
components/shared/
├── sidebar.tsx                        [CREATE]
├── header.tsx                         [CREATE]
├── user-avatar.tsx                    [CREATE]
├── nav-item.tsx                       [CREATE]
└── breadcrumb.tsx                     [CREATE]
store/ui.ts                            [CREATE — Zustand: sidebar open/close]
```

## Sidebar Navigation Structure
```
SmartMortgage Pro (logo)
─────────────────
📊 Dashboard          → /dashboard
📋 My Applications    → /my-loans        [borrower only]
📁 Pipeline           → /pipeline        [staff only]
─────────────────
Active Loans (section)
  → Individual loan sub-nav when in loan context
─────────────────
⚙️  Settings          → /settings
❓ Help               → /help
─────────────────
[User avatar + name + role badge]
[Sign out]
```

---

---

# ═══════════════════════════════════════════
# .ENV SETUP — Required for all features
# ═══════════════════════════════════════════

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Phase 2+
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

---

# ═══════════════════════════════════════════
# CODEX EXECUTION ORDER
# ═══════════════════════════════════════════

**Say to Codex:** `"Complete feature F-AUTH-01"` 

Codex will:
1. Read `.codex/skills/frontend-design/SKILL.md` and `.codex/skills/supabase/SKILL.md`
2. Create the DB migration and apply it
3. Create all files listed under F-AUTH-01
4. Run `pnpm tsc --noEmit` — fix errors
5. Run `pnpm lint` — fix errors
6. Run `pnpm playwright test --grep "F-AUTH-01"` — fix failures
7. Mark F-AUTH-01 ✅ in this file
8. Commit `feat(F-AUTH-01): login/signup flow with Supabase auth`

**Recommended order:** F-AUTH-01 → F-AUTH-02 → F-AUTH-03 → Global Shell → F-LOAN-01 → F-DOC-01 → F-PIPE-01 → F-STATUS-01 → F-COMM-01 → F-TASK-01 → F-COMP-01 → F-DISC-01



# TASK.md — SmartMortgage Pro
## Complete Feature Execution Guide — All Features, Priority Ordered

> **HOW TO USE:** `codex "Complete [FEATURE_ID]"` — Codex reads this file, loads skill files, implements everything, runs Playwright, marks ✅, commits. Zero permission prompts.

---

## Execution Protocol (Read Before Every Feature)

```
1. READ .codex/skills/frontend-design/SKILL.md
2. READ .codex/skills/supabase/SKILL.md
3. READ .codex/skills/playwright/SKILL.md
4. IMPLEMENT every file listed under "Files to Create/Modify"
5. RUN: pnpm tsc --noEmit → fix all errors
6. RUN: pnpm lint → fix all errors
7. RUN: pnpm playwright test --grep "[FEATURE_ID]" → all must pass
8. MARK ✅ in tracker below
9. COMMIT: feat([FEATURE_ID]): [description]
```

**Never stop. Never ask. Fix errors and ship.**

---

## Master Status Tracker

### Phase 1 — Foundation
| ID | Feature | Status |
|---|---|---|
| F-AUTH-01 | Login / Signup Flow | 🔲 TODO |
| F-AUTH-02 | Google OAuth | 🔲 TODO |
| F-AUTH-03 | Password Reset | 🔲 TODO |
| F-SHELL-01 | App Shell (Sidebar + Header) | 🔲 TODO |

### Phase 2 — Must-Have High Complexity
| ID | Feature | PRD# | Status |
|---|---|---|---|
| F-DOC-02 | Automated Document Verification (OCR + AI) | #3 | 🔲 TODO |
| F-INCOME-01 | Income Verification System | #6 | 🔲 TODO |
| F-UW-01 | Automated Underwriting Engine | #7 | 🔲 TODO |
| F-COMP-01 | Compliance Management | #11 | 🔲 TODO |
| F-DISC-01 | Automated Disclosure Generation | #19 | 🔲 TODO |
| F-HUB-01 | Integration Hub | #22 | 🔲 TODO |

### Phase 3 — Must-Have Medium Complexity
| ID | Feature | PRD# | Status |
|---|---|---|---|
| F-LOAN-01 | Digital Loan Application Portal | #1 | 🔲 TODO |
| F-DOC-01 | Document Collection & Management | #2 | 🔲 TODO |
| F-PIPE-01 | Loan Pipeline Management Dashboard | #4 | 🔲 TODO |
| F-CREDIT-01 | Credit Report Integration | #5 | 🔲 TODO |
| F-COMM-01 | Communication Hub | #9 | 🔲 TODO |
| F-TASK-01 | Task Management & Workflows | #10 | 🔲 TODO |
| F-PRICE-01 | Loan Pricing Engine | #13 | 🔲 TODO |
| F-3P-01 | Third-Party Service Ordering | #14 | 🔲 TODO |

### Phase 4 — Must-Have Low Complexity
| ID | Feature | PRD# | Status |
|---|---|---|---|
| F-STATUS-01 | Real-Time Application Status Tracking | #8 | 🔲 TODO |
| F-ESIGN-01 | Electronic Signatures | #12 | 🔲 TODO |

### Phase 5 — Important Features
| ID | Feature | PRD# | Complexity | Status |
|---|---|---|---|---|
| F-CRM-01 | Loan Officer CRM | #15 | Medium | 🔲 TODO |
| F-ANALYTICS-01 | Analytics & Reporting Dashboard | #17 | Medium | 🔲 TODO |
| F-LEAD-01 | Multi-channel Lead Capture | #18 | Medium | 🔲 TODO |
| F-COMMITTEE-01 | Loan Committee Management | #20 | Medium | 🔲 TODO |
| F-QC-01 | Quality Control Module | #21 | Medium | 🔲 TODO |

### Phase 6 — Advanced AI Features
| ID | Feature | PRD# | Status |
|---|---|---|---|
| F-AI-RISK-01 | AI-Powered Risk Assessment | A-01 | 🔲 TODO |
| F-AI-PREDICT-01 | Predictive Loan Performance Analytics | A-02 | 🔲 TODO |
| F-AI-DOC-01 | Intelligent Document Processing (NLP) | A-03 | 🔲 TODO |
| F-AI-RECCO-01 | Dynamic Loan Recommendation Engine | A-04 | 🔲 TODO |
| F-AI-FRAUD-01 | Advanced Fraud Detection | A-08 | 🔲 TODO |
| F-AI-CLOSE-01 | Automated Closing Coordination | A-09 | 🔲 TODO |
| F-AI-MARKET-01 | Real-time Market Data Integration | A-07 | 🔲 TODO |
| F-AI-REG-01 | Regulatory Change Management | A-11 | 🔲 TODO |
| F-AI-INVESTOR-01 | Investor / Secondary Market Integration | A-12 | 🔲 TODO |
| F-AI-PORTFOLIO-01 | Advanced Portfolio Analytics | A-13 | 🔲 TODO |

---
---

# PHASE 1 — FOUNDATION
---

# F-AUTH-01 — Login / Signup Flow
**Complexity:** Medium | **Must ship before anything else**

## Database Migration
```sql
-- supabase/migrations/001_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'borrower'
    check (role in ('borrower','loan_officer','processor','underwriter','admin')),
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "self_select" on profiles for select using (auth.uid() = id);
create policy "self_update" on profiles for update using (auth.uid() = id);
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Files to Create
```
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/admin.ts
lib/validations/auth.ts
actions/auth.ts
middleware.ts
app/(auth)/layout.tsx
app/(auth)/login/page.tsx
app/(auth)/signup/page.tsx
app/(auth)/forgot-password/page.tsx
app/(auth)/verify-email/page.tsx
app/auth/callback/route.ts
components/auth/login-form.tsx
components/auth/signup-form.tsx
components/auth/auth-left-panel.tsx
components/auth/google-oauth-button.tsx
components/auth/password-input.tsx
supabase/migrations/001_profiles.sql
```

## UI Spec (Match login-reference.png)
- Page bg: `#EEF2FF`, centered card `max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex`
- Left panel (45%): bg `#EEF2FF`, dot-grid `radial-gradient(#C7D2FE 1px, transparent 1px) / 20px 20px`, SVG line-chart polyline stroke `#3B4FE4`, circular arrow button `w-14 h-14 rounded-full bg-[#3B4FE4]`, brand `text-3xl font-extrabold text-[#3B4FE4]`
- Right panel (55%): bg white, `p-12`, "Welcome back" `text-4xl font-bold text-gray-900`
- Google btn: `border border-gray-200 rounded-xl h-14 w-full flex items-center justify-center gap-3 hover:bg-gray-50`
- Inputs: `bg-[#F5F6FA] border-0 rounded-xl h-12 px-4 focus:ring-2 focus:ring-[#3B4FE4]`
- CTA: `bg-[#3B4FE4] hover:bg-[#2D3FD4] text-white h-14 rounded-xl font-semibold w-full`
- Password toggle: `data-testid="password-toggle"` absolute right-4

## Zod Schemas (lib/validations/auth.ts)
```typescript
export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
export const SignupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: "Passwords don't match", path: ['confirm_password'],
})
```

## Middleware (middleware.ts)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
const PUBLIC = ['/login','/signup','/forgot-password','/auth/callback','/auth/verify-email']
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (s) => { s.forEach(({name,value,options}) => response.cookies.set(name,value,options)) } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const isPublic = PUBLIC.some(r => request.nextUrl.pathname.startsWith(r))
  if (!user && !isPublic) return NextResponse.redirect(new URL('/login', request.url))
  if (user && isPublic && !request.nextUrl.pathname.startsWith('/auth/callback')) return NextResponse.redirect(new URL('/dashboard', request.url))
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'] }
```

## Playwright Tests
```typescript
// e2e/flows/auth.spec.ts
test.describe('F-AUTH-01', () => {
  test('login page renders split layout', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Login with Google')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
  })
  test('validates empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Sign in")')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
  })
  test('password toggle works', async ({ page }) => {
    await page.goto('/login')
    await page.locator('[data-testid="password-toggle"]').click()
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
  })
  test('signup password mismatch error', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('input[name="full_name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirm_password"]', 'different123')
    await page.click('button:has-text("Create account")')
    await expect(page.locator("text=Passwords don't match")).toBeVisible()
  })
  test('unauthenticated redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
```

## Acceptance Criteria
- [ ] Split layout matches design reference pixel-for-pixel
- [ ] All Zod validations fire client-side before network call
- [ ] Google OAuth button calls supabase.auth.signInWithOAuth
- [ ] Successful login redirects to /dashboard, failed → inline error
- [ ] Password show/hide toggle with data-testid="password-toggle"
- [ ] Profile auto-created via DB trigger on signup
- [ ] Middleware: unauth → /login, auth on public page → /dashboard
- [ ] All Playwright tests pass

---

# F-SHELL-01 — App Shell (Sidebar + Header)
**Complexity:** Low | **Required before all app features**

## Files to Create
```
app/(app)/layout.tsx
app/(app)/dashboard/page.tsx
app/(app)/dashboard/loading.tsx
components/shared/sidebar.tsx
components/shared/header.tsx
components/shared/nav-item.tsx
components/shared/user-avatar.tsx
components/shared/breadcrumb.tsx
store/ui.ts
```

## Sidebar Structure
```
Logo: SmartMortgage Pro (blue #3B4FE4)
────────────────────────────
Dashboard           /dashboard
My Applications     /my-loans          [borrower only]
Pipeline            /pipeline          [staff only]
────────────────────────────
Settings            /settings
Help                /help
────────────────────────────
[Avatar] [Name] [Role badge]
[Sign out]
```

## UI Spec
- Sidebar: `w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0`
- Active nav: `bg-blue-50 text-[#3B4FE4] font-medium rounded-lg`
- Role badge pill: borrower=blue, officer=green, admin=purple
- Main content: `flex-1 bg-[#F8FAFF] overflow-auto`

## Zustand Store (store/ui.ts)
```typescript
import { create } from 'zustand'
interface UIStore {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))
```

## Playwright Tests
```typescript
test.describe('F-SHELL-01', () => {
  test.use({ storageState: 'e2e/fixtures/borrower-auth.json' })
  test('sidebar renders with nav items', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
  test('role-based nav: borrower sees My Applications', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('text=My Applications')).toBeVisible()
    await expect(page.locator('text=Pipeline')).not.toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Sidebar sticky, collapsible on mobile
- [ ] Role-based nav items
- [ ] Active route highlighted
- [ ] Sign out → /login

---
---

# PHASE 2 — MUST-HAVE HIGH COMPLEXITY
---

# F-DOC-02 — Automated Document Verification (OCR + AI)
**PRD #3 | Complexity: High | Must-Have**

## What It Does
OCR extracts key fields → Claude validates against application data → fraud signals detected → low confidence → human review queue

## Database Migration
```sql
-- supabase/migrations/007_document_verification.sql
create type verification_status as enum ('pending','processing','verified','failed','needs_review');

create table document_verifications (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  status verification_status not null default 'pending',
  extracted_fields jsonb,
  confidence_score numeric(4,3),
  validation_errors jsonb,
  fraud_signals jsonb,
  ocr_provider text default 'llamaparse',
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table verification_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id),
  verification_id uuid references document_verifications(id),
  assigned_to uuid references auth.users(id),
  priority int not null default 5 check (priority between 1 and 10),
  reason text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table document_verifications enable row level security;
alter table verification_queue enable row level security;
create policy "staff_verifications" on document_verifications for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('processor','underwriter','admin','loan_officer')));
create policy "staff_queue" on verification_queue for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('processor','underwriter','admin')));
```

## Files to Create
```
inngest/functions/verify-document.ts
lib/services/document-verification.ts
lib/integrations/llamaparse.ts
lib/integrations/anthropic.ts
app/(app)/loans/[loanId]/documents/verification/page.tsx
app/(app)/review-queue/page.tsx
app/(app)/review-queue/[verificationId]/page.tsx
components/document-verification/
├── verification-status-badge.tsx
├── extracted-fields-table.tsx
├── fraud-signals-panel.tsx
├── confidence-meter.tsx
├── human-review-form.tsx
└── verification-timeline.tsx
```

## Inngest Function (inngest/functions/verify-document.ts)
```typescript
export const verifyDocument = inngest.createFunction(
  { id: 'verify-document', retries: 3, concurrency: { limit: 10 } },
  { event: 'document/uploaded' },
  async ({ event, step }) => {
    const { documentId, loanId, category } = event.data
    const fileBuffer = await step.run('download-file', async () => {
      const supabase = createAdminClient()
      const { data: doc } = await supabase.from('documents').select('storage_path').eq('id', documentId).single()
      const { data } = await supabase.storage.from('documents').download(doc!.storage_path)
      return Buffer.from(await data!.arrayBuffer()).toString('base64')
    })
    const extractedFields = await step.run('ocr-extract', async () => {
      return llamaParseExtract(fileBuffer, category)
    })
    const validationResult = await step.run('ai-validate', async () => {
      const loanData = await getLoanApplicationData(loanId)
      return claudeValidateDocument(extractedFields, loanData, category)
    })
    const fraudSignals = await step.run('fraud-detection', async () => {
      return claudeDetectFraud(extractedFields, category)
    })
    await step.run('persist-results', async () => {
      const supabase = createAdminClient()
      const confidenceScore = calculateConfidence(validationResult, fraudSignals)
      const status = confidenceScore >= 0.95 && fraudSignals.length === 0 ? 'verified' : 'needs_review'
      await supabase.from('document_verifications').insert({
        document_id: documentId, status, extracted_fields: extractedFields,
        confidence_score: confidenceScore, validation_errors: validationResult.errors,
        fraud_signals: fraudSignals, processing_completed_at: new Date().toISOString(),
      })
      if (status === 'needs_review') {
        await supabase.from('verification_queue').insert({
          document_id: documentId,
          priority: fraudSignals.some((s: any) => s.severity === 'critical') ? 1 : 5,
          reason: `Confidence: ${confidenceScore}, fraud signals: ${fraudSignals.length}`,
        })
      }
      await supabase.from('documents').update({ status }).eq('id', documentId)
    })
  }
)
```

## Claude Integration (lib/integrations/anthropic.ts)
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function claudeValidateDocument(extracted: Record<string, string>, loanData: Record<string, unknown>, category: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a mortgage document validator. Compare extracted fields against loan application data.
Return ONLY valid JSON: { "errors": [{field, extracted, expected, description}], "warnings": [{field, description}] }`,
    messages: [{ role: 'user', content: `Document: ${category}\nExtracted: ${JSON.stringify(extracted)}\nLoan data: ${JSON.stringify(loanData)}` }]
  })
  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{"errors":[],"warnings":[]}')
}

export async function claudeDetectFraud(extracted: Record<string, string>, category: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a mortgage fraud detection expert. Return ONLY JSON array: [{type, severity: "low|medium|high|critical", description}]. Empty array if none found.`,
    messages: [{ role: 'user', content: `Document type: ${category}. Fields: ${JSON.stringify(extracted)}` }]
  })
  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '[]')
}
```

## UI Spec
- confidence-meter: Circular ring, `<70%` red, `70-90%` yellow, `>90%` green
- extracted-fields-table: Field | Extracted | Application Value | Status (✅/❌/⚠️)
- fraud-signals-panel: Collapsible, red border if critical, badge count on header
- human-review-form: Approve/Reject/Request-Reupload radio + notes textarea

## Playwright Tests
```typescript
test.describe('F-DOC-02', () => {
  test('verification status badge on document card', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/documents')
    await expect(page.locator('[data-testid="verification-status-badge"]').first()).toBeVisible()
  })
  test('review queue shows pending items', async ({ page }) => {
    await page.goto('/review-queue')
    await expect(page.locator('[data-testid="review-queue-table"]')).toBeVisible()
  })
  test('extracted fields and confidence meter render', async ({ page }) => {
    await page.goto('/review-queue/[testVerificationId]')
    await expect(page.locator('[data-testid="extracted-fields-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="confidence-meter"]')).toBeVisible()
  })
  test('review requires notes before submit', async ({ page }) => {
    await page.goto('/review-queue/[testVerificationId]')
    await page.click('[data-testid="review-approve"]')
    await page.click('button:has-text("Submit Review")')
    await expect(page.locator('text=Notes are required')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Inngest fires on document/uploaded event
- [ ] LlamaParse OCR within 60 seconds
- [ ] Claude validates extracted vs application fields
- [ ] Confidence ≥ 95% + no fraud → auto-verified
- [ ] < 70% confidence or fraud signals → human review queue
- [ ] Human approve/reject/request-reupload workflow
- [ ] All Playwright tests pass

---

# F-INCOME-01 — Income Verification System
**PRD #6 | Complexity: High | Must-Have**

## Database Migration
```sql
-- supabase/migrations/008_income_verification.sql
create type employment_verification_type as enum ('payroll_provider','bank_statement','manual','tax_return');
create type income_verification_status as enum ('pending','in_progress','verified','failed','manual_review');

create table income_verifications (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  borrower_id uuid not null references auth.users(id),
  verification_type employment_verification_type not null,
  status income_verification_status not null default 'pending',
  provider text,
  provider_request_id text,
  stated_annual_income numeric(12,2),
  verified_annual_income numeric(12,2),
  variance_percentage numeric(5,2),
  income_breakdown jsonb,
  qualifying_income numeric(12,2),
  calculation_methodology text,
  employer_name text,
  employment_start_date date,
  is_current_employer boolean,
  override_amount numeric(12,2),
  override_justification text,
  override_by uuid references auth.users(id),
  override_at timestamptz,
  bank_statement_months int,
  raw_provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table income_verifications enable row level security;
create policy "borrower_own" on income_verifications for select using (borrower_id = auth.uid());
create policy "staff_all" on income_verifications for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
```

## Files to Create
```
lib/integrations/argyle.ts
lib/integrations/pinwheel.ts
lib/services/income-verification.ts
lib/utils/income-calculator.ts
inngest/functions/verify-income.ts
inngest/functions/analyze-bank-statements.ts
app/(app)/loans/[loanId]/income/page.tsx
app/api/webhooks/argyle/route.ts
app/api/webhooks/pinwheel/route.ts
components/income-verification/
├── income-verification-card.tsx
├── payroll-connect-button.tsx
├── income-breakdown-table.tsx
├── stated-vs-verified-comparison.tsx
├── income-override-form.tsx
├── bank-statement-uploader.tsx
└── qualifying-income-summary.tsx
```

## Income Calculator (lib/utils/income-calculator.ts)
```typescript
interface IncomeItem {
  type: 'base' | 'overtime' | 'bonus' | 'commission' | 'rental' | 'other'
  annualAmount: number
  monthsHistory: number
}
export function calculateQualifyingIncome(items: IncomeItem[]) {
  return items.map(item => {
    switch (item.type) {
      case 'base': return { type: 'Base Salary', qualifying: item.annualAmount, included: true, reason: 'Full amount' }
      case 'overtime': return { type: 'Overtime', qualifying: item.monthsHistory >= 24 ? item.annualAmount : 0, included: item.monthsHistory >= 24, reason: item.monthsHistory >= 24 ? '24-month avg' : 'Need 24mo history' }
      case 'bonus': return { type: 'Bonus', qualifying: item.monthsHistory >= 24 ? item.annualAmount : 0, included: item.monthsHistory >= 24, reason: item.monthsHistory >= 24 ? '24-month avg' : 'Need 24mo history' }
      case 'commission': return { type: 'Commission', qualifying: item.monthsHistory >= 24 ? item.annualAmount : 0, included: item.monthsHistory >= 24, reason: item.monthsHistory >= 24 ? '24-month avg' : 'Need 24mo history' }
      case 'rental': return { type: 'Rental', qualifying: item.annualAmount * 0.75, included: true, reason: '75% per Fannie Mae guidelines' }
      default: return { type: item.type, qualifying: 0, included: false, reason: 'Manual underwriter review required' }
    }
  })
}
```

## Playwright Tests
```typescript
test.describe('F-INCOME-01', () => {
  test('income page renders qualifying summary', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/income')
    await expect(page.locator('[data-testid="qualifying-income-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="income-breakdown-table"]')).toBeVisible()
  })
  test('stated vs verified comparison renders', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/income')
    await expect(page.locator('[data-testid="stated-vs-verified"]')).toBeVisible()
  })
  test('override requires justification', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/income')
    await page.click('[data-testid="override-income-btn"]')
    await page.fill('[data-testid="override-amount"]', '85000')
    await page.click('button:has-text("Apply Override")')
    await expect(page.locator('text=Justification is required')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Payroll connect (Argyle/Pinwheel) Link widget
- [ ] Bank statement upload → Inngest analysis
- [ ] Qualifying income per Fannie Mae guidelines (base/OT/bonus/commission/rental rules)
- [ ] Stated vs verified with variance %
- [ ] Manual override requires justification, logged with user + timestamp
- [ ] Webhook endpoints for provider callbacks
- [ ] All Playwright tests pass

---

# F-UW-01 — Automated Underwriting Engine
**PRD #7 | Complexity: High | Must-Have**

## Database Migration
```sql
-- supabase/migrations/009_underwriting.sql
create type aus_decision as enum ('approve_eligible','refer','refer_with_caution','out_of_scope','ineligible','caution','approve');
create type condition_type as enum ('prior_to_approval','prior_to_doc','prior_to_closing','prior_to_funding');
create type condition_status as enum ('open','received','satisfied','waived');

create table underwriting_submissions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  aus_system text not null check (aus_system in ('du','lpa','manual')),
  submission_number int not null default 1,
  credit_score int, ltv_ratio numeric(5,2), dti_ratio numeric(5,2),
  loan_amount numeric(12,2), property_value numeric(12,2), loan_type text, occupancy_type text,
  decision aus_decision, risk_class text, findings_summary text, raw_response jsonb,
  submitted_at timestamptz not null default now(),
  response_received_at timestamptz,
  submitted_by uuid references auth.users(id)
);

create table underwriting_conditions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  submission_id uuid references underwriting_submissions(id),
  condition_type condition_type not null,
  status condition_status not null default 'open',
  description text not null,
  source text,
  assigned_to uuid references auth.users(id),
  due_date date,
  cleared_by uuid references auth.users(id),
  cleared_at timestamptz,
  clearing_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table underwriting_overrides (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  rule_violated text not null,
  override_reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  denied_by uuid references auth.users(id),
  denied_at timestamptz,
  created_at timestamptz not null default now()
);

alter table underwriting_submissions enable row level security;
alter table underwriting_conditions enable row level security;
alter table underwriting_overrides enable row level security;
create policy "staff_uw" on underwriting_submissions for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
create policy "staff_conditions" on underwriting_conditions for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
create policy "uw_insert_override" on underwriting_overrides for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Files to Create
```
lib/services/underwriting.ts
lib/services/underwriting-rules.ts
lib/integrations/fannie-mae-du.ts
lib/integrations/freddie-mac-lpa.ts
inngest/functions/submit-to-aus.ts
app/(app)/loans/[loanId]/underwriting/page.tsx
app/(app)/loans/[loanId]/underwriting/conditions/page.tsx
components/underwriting/
├── aus-submission-form.tsx
├── decision-badge.tsx
├── findings-accordion.tsx
├── conditions-list.tsx
├── condition-card.tsx
├── condition-clear-form.tsx
├── override-request-form.tsx
├── override-approval-panel.tsx
├── dti-ltv-indicators.tsx
└── underwriting-history.tsx
```

## Rule Engine (lib/services/underwriting-rules.ts)
```typescript
export function evaluateUnderwritingRules(input: {
  creditScore: number; ltvRatio: number; dtiRatio: number
  loanType: 'conventional'|'fha'|'va'|'jumbo'; occupancyType: 'primary'|'secondary'|'investment'
  reserveMonths: number
}) {
  const results = []
  const minScores = { conventional: 620, fha: 580, va: 620, jumbo: 720 }
  results.push({ passed: input.creditScore >= minScores[input.loanType], rule: 'Minimum Credit Score', actual: String(input.creditScore), limit: `>= ${minScores[input.loanType]}`, severity: 'critical' as const })
  const maxLTV = { conventional: { primary: 97, secondary: 90, investment: 85 }, fha: { primary: 96.5, secondary: 0, investment: 0 }, va: { primary: 100, secondary: 90, investment: 0 }, jumbo: { primary: 80, secondary: 75, investment: 70 } }
  const maxL = maxLTV[input.loanType]?.[input.occupancyType] ?? 80
  results.push({ passed: input.ltvRatio <= maxL, rule: 'Maximum LTV', actual: `${input.ltvRatio}%`, limit: `<= ${maxL}%`, severity: 'critical' as const })
  const maxDTI = input.loanType === 'fha' ? 57 : input.loanType === 'va' ? 60 : 45
  results.push({ passed: input.dtiRatio <= maxDTI, rule: 'Maximum DTI', actual: `${input.dtiRatio}%`, limit: `<= ${maxDTI}%`, severity: 'critical' as const })
  const criticalFails = results.filter(r => !r.passed && r.severity === 'critical').length
  return { approved: criticalFails === 0, results, overallRisk: criticalFails > 0 ? 'ineligible' as const : 'low' as const }
}
```

## Playwright Tests
```typescript
test.describe('F-UW-01', () => {
  test('underwriting page shows decision badge', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/underwriting')
    await expect(page.locator('[data-testid="decision-badge"]')).toBeVisible()
  })
  test('DTI and LTV indicators render', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/underwriting')
    await expect(page.locator('[data-testid="dti-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="ltv-indicator"]')).toBeVisible()
  })
  test('conditions list renders', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/underwriting/conditions')
    await expect(page.locator('[data-testid="conditions-list"]')).toBeVisible()
  })
  test('override form requires justification', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/underwriting')
    await page.click('[data-testid="request-override-btn"]')
    await page.click('button:has-text("Submit Override")')
    await expect(page.locator('text=Justification is required')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Rule engine evaluates credit score, LTV, DTI per loan type
- [ ] AUS submission and response within 45 seconds
- [ ] All conditions auto-generated and traceable to rule/finding
- [ ] Condition clearing workflow with documentation
- [ ] Exception overrides require manager approval + audit log
- [ ] Findings in human-readable language
- [ ] All Playwright tests pass

---

# F-COMP-01 — Compliance Management
**PRD #11 | Complexity: High | Must-Have**

## Database Migration
```sql
-- supabase/migrations/010_compliance.sql
create type regulation as enum ('trid','respa','hmda','ecoa','fcra','glba','state','ada');
create type compliance_check_status as enum ('pass','warning','violation','pending','waived');

create table compliance_checks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  regulation regulation not null,
  check_name text not null,
  status compliance_check_status not null default 'pending',
  description text not null,
  remediation text,
  deadline timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  waived_by uuid references auth.users(id),
  waiver_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compliance_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  event_type text not null,
  event_date timestamptz not null default now(),
  performed_by uuid references auth.users(id),
  notes text,
  metadata jsonb
);

-- Immutable audit log — NO update/delete policies
create table compliance_audit_log (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  action text not null,
  performed_by uuid references auth.users(id),
  details jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

alter table compliance_checks enable row level security;
alter table compliance_events enable row level security;
alter table compliance_audit_log enable row level security;
create policy "staff_checks" on compliance_checks for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
create policy "staff_events" on compliance_events for all
  using (exists (select 1 from profiles where id = auth.uid()));
-- Audit log: insert only
create policy "staff_insert_audit" on compliance_audit_log for insert
  with check (exists (select 1 from profiles where id = auth.uid()));
create policy "admin_select_audit" on compliance_audit_log for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Files to Create
```
lib/services/compliance.ts
lib/services/trid-calculator.ts
lib/services/compliance-rules.ts
inngest/functions/run-compliance-checks.ts
inngest/functions/compliance-deadline-alerts.ts
app/(app)/loans/[loanId]/compliance/page.tsx
components/compliance/
├── compliance-status-overview.tsx
├── compliance-check-row.tsx
├── trid-timeline.tsx
├── regulation-badge.tsx
├── violation-alert-banner.tsx
├── waiver-form.tsx
└── audit-log-table.tsx
```

## TRID Calculator (lib/services/trid-calculator.ts)
```typescript
function businessDays(date: Date, days: number): Date {
  let count = 0; const d = new Date(date)
  const dir = days > 0 ? 1 : -1; const abs = Math.abs(days)
  while (count < abs) {
    d.setDate(d.getDate() + dir)
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
  }
  return d
}
export function calculateTRIDDeadlines(applicationDate: Date, closingDate: Date) {
  return {
    leDeadline: businessDays(applicationDate, 3),
    earliestClosing: businessDays(applicationDate, 7),
    cdDeadline: businessDays(closingDate, -3),
  }
}
export function checkTRIDCompliance(loan: { applicationDate: Date; leIssuedDate?: Date; cdIssuedDate?: Date; closingDate?: Date }) {
  const violations: string[] = []; const warnings: string[] = []
  const deadlines = calculateTRIDDeadlines(loan.applicationDate, loan.closingDate ?? new Date())
  if (loan.leIssuedDate && loan.leIssuedDate > deadlines.leDeadline)
    violations.push(`LE issued ${loan.leIssuedDate.toDateString()} — deadline was ${deadlines.leDeadline.toDateString()}`)
  else if (!loan.leIssuedDate) {
    const days = Math.ceil((deadlines.leDeadline.getTime() - Date.now()) / 86400000)
    if (days <= 1) warnings.push(`LE deadline in ${days} day(s)`)
  }
  return { violations, warnings, deadlines, isCompliant: violations.length === 0 }
}
```

## Playwright Tests
```typescript
test.describe('F-COMP-01', () => {
  test('compliance page shows regulation overview', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/compliance')
    await expect(page.locator('text=TRID')).toBeVisible()
    await expect(page.locator('[data-testid="trid-timeline"]')).toBeVisible()
  })
  test('violation banner shows when violations exist', async ({ page }) => {
    await page.goto('/loans/[violatingLoanId]/compliance')
    await expect(page.locator('[data-testid="violation-alert-banner"]')).toBeVisible()
  })
  test('audit log has no edit/delete controls', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/compliance')
    await page.click('text=Audit Log')
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible()
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] TRID deadlines calculated correctly (3 business days LE, 3 before closing for CD)
- [ ] Proactive warnings before violations occur
- [ ] RESPA, HMDA, ECOA, FCRA checks implemented
- [ ] Audit log immutable (no UPDATE/DELETE policies)
- [ ] Audit log exportable as CSV
- [ ] Inngest daily job checks all open loans for upcoming deadlines
- [ ] All Playwright tests pass

---

# F-DISC-01 — Automated Disclosure Generation
**PRD #19 | Complexity: High | Must-Have**

## Database Migration
```sql
-- supabase/migrations/011_disclosures.sql
create type disclosure_type as enum ('loan_estimate','closing_disclosure','intent_to_proceed','adverse_action','appraisal_notice');
create type disclosure_status as enum ('draft','generated','sent','acknowledged','expired','superseded');
create type fee_tolerance as enum ('zero','ten_percent','unlimited');

create table disclosures (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  type disclosure_type not null,
  status disclosure_status not null default 'draft',
  version int not null default 1,
  issued_date timestamptz, due_date timestamptz,
  sent_to_borrower_at timestamptz,
  acknowledged_by_borrower_at timestamptz,
  acknowledgement_method text,
  fees_snapshot jsonb, loan_terms_snapshot jsonb,
  state text, file_path text,
  generated_by uuid references auth.users(id),
  supersedes_id uuid references disclosures(id),
  change_of_circumstance_reason text,
  change_of_circumstance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table disclosure_fees (
  id uuid primary key default gen_random_uuid(),
  disclosure_id uuid not null references disclosures(id) on delete cascade,
  fee_name text not null, fee_category text not null,
  tolerance_type fee_tolerance not null,
  le_amount numeric(10,2), cd_amount numeric(10,2)
);

alter table disclosures enable row level security;
alter table disclosure_fees enable row level security;
create policy "borrower_own" on disclosures for select
  using (loan_id in (select id from loans where borrower_id = auth.uid()));
create policy "staff_all" on disclosures for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
```

## Files to Create
```
lib/services/disclosures.ts
lib/services/fee-tolerance-checker.ts
inngest/functions/generate-disclosure.ts
inngest/functions/disclosure-reminder.ts
app/(app)/loans/[loanId]/disclosures/page.tsx
app/(app)/loans/[loanId]/disclosures/[disclosureId]/page.tsx
components/disclosures/
├── disclosure-card.tsx
├── disclosure-timeline.tsx
├── fee-tolerance-table.tsx
├── generate-disclosure-button.tsx
├── changed-circumstance-form.tsx
├── acknowledgement-status.tsx
└── disclosure-delivery-tracker.tsx
```

## Fee Tolerance Checker (lib/services/fee-tolerance-checker.ts)
```typescript
export const ZERO_TOLERANCE = ['Origination Charges','Points','Application Fee','Underwriting Fee','Transfer Taxes']
export const TEN_PERCENT_TOLERANCE = ['Recording Fees','Required Third-Party Services (shopping list)']

export function checkFeeTolerances(leFees: {name:string;category:string;amount:number}[], cdFees: {name:string;category:string;amount:number}[]) {
  const violations = []
  let tenPctLE = 0, tenPctCD = 0
  for (const cd of cdFees) {
    const le = leFees.find(f => f.name === cd.name)
    if (!le) continue
    if (ZERO_TOLERANCE.includes(cd.category) && cd.amount > le.amount)
      violations.push({ fee: cd.name, type: 'zero', le: le.amount, cd: cd.amount, overage: cd.amount - le.amount })
    else if (TEN_PERCENT_TOLERANCE.includes(cd.category)) {
      tenPctLE += le.amount; tenPctCD += cd.amount
    }
  }
  if (tenPctCD > tenPctLE * 1.1)
    violations.push({ fee: '10% Aggregate', type: 'ten_percent', le: tenPctLE, cd: tenPctCD, overage: tenPctCD - tenPctLE * 1.1 })
  return { violations, compliant: violations.length === 0 }
}
```

## Playwright Tests
```typescript
test.describe('F-DISC-01', () => {
  test('disclosures list renders', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/disclosures')
    await expect(page.locator('[data-testid="disclosure-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="generate-le-btn"]')).toBeEnabled()
  })
  test('fee tolerance table shows violations in red', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/disclosures/[cdDisclosureId]')
    await expect(page.locator('[data-testid="fee-tolerance-table"]')).toBeVisible()
  })
  test('changed circumstance form requires reason', async ({ page }) => {
    await page.goto('/loans/[testLoanId]/disclosures')
    await page.click('[data-testid="redisclose-btn"]')
    await page.click('button:has-text("Generate Re-disclosure")')
    await expect(page.locator('text=Reason is required')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] LE generated within 3 business days of application
- [ ] CD delivered ≥ 3 business days before consummation
- [ ] Zero/10%/unlimited tolerance categories correctly applied
- [ ] Fee violation rows highlighted in UI
- [ ] Changed circumstance triggers re-disclosure
- [ ] Delivery + acknowledgement timestamps tracked
- [ ] Inngest reminders for unacknowledged disclosures after 24h
- [ ] All Playwright tests pass

---

# F-HUB-01 — Integration Hub
**PRD #22 | Complexity: High | Must-Have**

## Database Migration
```sql
-- supabase/migrations/012_integrations.sql
create table integration_connectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  connector_type text not null check (connector_type in ('los','crm','credit_bureau','aus','esign','payroll','appraisal','title','flood','bank')),
  provider text not null,
  status text not null default 'inactive' check (status in ('active','inactive','error','pending_auth')),
  config jsonb, credentials_ref text,
  last_sync_at timestamptz, last_error text,
  created_at timestamptz not null default now()
);

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid references integration_connectors(id),
  direction text not null check (direction in ('inbound','outbound')),
  event_type text not null,
  payload jsonb, headers jsonb,
  status text not null default 'received' check (status in ('received','processing','processed','failed')),
  error text, processed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table integration_connectors enable row level security;
alter table webhook_events enable row level security;
create policy "admin_only_connectors" on integration_connectors for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
```

## Files to Create
```
app/(app)/settings/integrations/page.tsx
app/(app)/settings/integrations/[connectorId]/page.tsx
app/api/webhooks/[provider]/route.ts
lib/services/integrations.ts
lib/integrations/webhook-verifier.ts
lib/integrations/encompass.ts
lib/integrations/salesforce.ts
lib/integrations/docusign.ts
components/integrations/
├── connector-card.tsx
├── connector-status-badge.tsx
├── connector-config-form.tsx
├── webhook-event-log.tsx
└── oauth-connect-button.tsx
```

## Webhook Verifier (lib/integrations/webhook-verifier.ts)
```typescript
import crypto from 'crypto'
export function verifyWebhookSignature(provider: string, payload: string, headers: Record<string, string>, secret: string): boolean {
  switch (provider) {
    case 'stripe': {
      const parts = (headers['stripe-signature'] ?? '').split(',')
      const ts = parts.find(p => p.startsWith('t='))?.slice(2) ?? ''
      const v1 = parts.find(p => p.startsWith('v1='))?.slice(3) ?? ''
      const expected = crypto.createHmac('sha256', secret).update(`${ts}.${payload}`).digest('hex')
      return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))
    }
    default: {
      const sig = headers['x-webhook-signature'] ?? headers['x-hub-signature-256']?.slice(7) ?? ''
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
      return sig.length > 0 && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    }
  }
}
```

## Acceptance Criteria
- [ ] Integration hub lists all connectors with status
- [ ] OAuth2 connect/disconnect per connector
- [ ] All inbound webhooks HMAC-verified before processing
- [ ] Webhook event log with payload viewer (admin only)
- [ ] Failed webhooks auto-retried via Inngest
- [ ] Connector health monitoring (last sync, error state)

---
---

# PHASE 3 — MUST-HAVE MEDIUM COMPLEXITY
---

# F-LOAN-01 — Digital Loan Application Portal
**PRD #1 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/002_loans.sql
create type loan_type as enum ('purchase','refinance','heloc','fha','va','usda','jumbo');
create type loan_status as enum ('draft','submitted','processing','underwriting','approved','denied','closed','withdrawn');
create type employment_type as enum ('w2_employee','self_employed','retired','unemployed','other');

create table loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references auth.users(id),
  loan_officer_id uuid references auth.users(id),
  loan_type loan_type not null default 'purchase',
  status loan_status not null default 'draft',
  property_address text, property_city text, property_state text, property_zip text,
  property_type text, purchase_price numeric(12,2), down_payment numeric(12,2), loan_amount numeric(12,2),
  first_name text, last_name text, email text, phone text,
  ssn_last4 text, date_of_birth date, marital_status text,
  employment_type employment_type, employer_name text, job_title text,
  years_employed numeric(4,1), annual_income numeric(12,2),
  has_coborrower boolean default false,
  coborrower_id uuid references auth.users(id),
  current_step int not null default 1,
  completed_steps int[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table loans enable row level security;
create policy "borrower_own" on loans for all using (borrower_id = auth.uid());
create policy "staff_select" on loans for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
```

## Files to Create
```
app/(app)/apply/page.tsx
app/(app)/apply/[step]/page.tsx
app/(app)/apply/layout.tsx
app/(app)/my-loans/page.tsx
components/loan-application/
├── step-progress.tsx
├── step-1-personal.tsx
├── step-2-property.tsx
├── step-3-employment.tsx
├── step-4-income.tsx
├── step-5-review.tsx
├── nav-buttons.tsx
└── co-borrower-section.tsx
lib/validations/loan-application.ts
actions/loans.ts
hooks/use-loan-application.ts
```

## Step Definitions
```
Step 1: Personal Info    — first/last name, DOB, SSN last4, email, phone, marital status
Step 2: Property Details — address, city, state, zip, type, purchase price, down payment
Step 3: Employment       — type, employer, title, years, start date
Step 4: Income           — annual income, other income, co-borrower toggle
Step 5: Review & Submit  — summary of all fields with edit links, URLA consent checkbox
```

## Playwright Tests
```typescript
test.describe('F-LOAN-01', () => {
  test.use({ storageState: 'e2e/fixtures/borrower-auth.json' })
  test('redirects /apply to /apply/1', async ({ page }) => {
    await page.goto('/apply')
    await expect(page).toHaveURL('/apply/1')
  })
  test('step 1 validates required fields', async ({ page }) => {
    await page.goto('/apply/1')
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=First name is required')).toBeVisible()
  })
  test('complete step 1 advances to step 2', async ({ page }) => {
    await page.goto('/apply/1')
    await page.fill('input[name="first_name"]', 'John')
    await page.fill('input[name="last_name"]', 'Doe')
    await page.fill('input[name="email"]', 'john@test.com')
    await page.fill('input[name="phone"]', '5551234567')
    await page.click('button:has-text("Next")')
    await expect(page).toHaveURL('/apply/2')
  })
  test('save and resume continues from last step', async ({ page }) => {
    await page.goto('/apply/2')
    await page.click('button:has-text("Save & Exit")')
    await page.goto('/apply')
    await expect(page).toHaveURL(/\/apply\/[2-5]/)
  })
})
```

## Acceptance Criteria
- [ ] 5-step form with progress indicator
- [ ] Per-step Zod validation before advancing
- [ ] Auto-save as draft on each step
- [ ] Save & Resume — returns to last incomplete step
- [ ] Submit → status submitted → redirect /my-loans
- [ ] WCAG 2.1 AA accessible

---

# F-DOC-01 — Document Collection & Management
**PRD #2 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/003_documents.sql
create type doc_category as enum ('pay_stub','w2','bank_statement','tax_return','id_document','employment_letter','appraisal','title_commitment','insurance','other');
create type doc_status as enum ('pending','processing','verified','rejected','expired','needs_reupload');

create table documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  category doc_category not null default 'other',
  file_name text not null, file_size bigint not null, mime_type text not null, storage_path text not null,
  status doc_status not null default 'pending',
  rejection_reason text, expires_at date,
  version int not null default 1,
  previous_version_id uuid references documents(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table documents enable row level security;
create policy "loan_party_docs" on documents for select
  using (loan_id in (select id from loans where borrower_id = auth.uid())
    or uploaded_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
create policy "upload_own" on documents for insert with check (uploaded_by = auth.uid());
```

## Files to Create
```
app/(app)/loans/[loanId]/documents/page.tsx
components/documents/
├── document-upload-zone.tsx
├── document-checklist.tsx
├── document-card.tsx
├── document-status-badge.tsx
├── upload-progress.tsx
├── document-expiry-alert.tsx
├── bulk-download-button.tsx
└── document-version-history.tsx
actions/documents.ts
lib/services/documents.ts
hooks/use-documents.ts
```

## Acceptance Criteria
- [ ] Dynamic checklist based on loan type + employment type
- [ ] Drag & drop + click-to-browse
- [ ] PDF, JPG, PNG only; max 50MB
- [ ] Upload progress per file
- [ ] Expiry alerts for docs > 60 days
- [ ] Version history on re-upload
- [ ] Bulk download as ZIP

---

# F-PIPE-01 — Loan Pipeline Management Dashboard
**PRD #4 | Complexity: Medium | Must-Have**

## Files to Create
```
app/(app)/pipeline/page.tsx
app/(app)/pipeline/loading.tsx
components/pipeline/
├── pipeline-kanban.tsx
├── pipeline-column.tsx
├── loan-card.tsx
├── pipeline-filters.tsx
├── loan-health-chip.tsx
├── pipeline-stats-bar.tsx
├── stage-transition-modal.tsx
└── bulk-action-toolbar.tsx
hooks/use-pipeline.ts
lib/services/pipeline.ts
```

## Kanban Stages
```
Application → Processing → Underwriting → Conditional Approval → Clear to Close → Closed
```

## Loan Card Spec
- Borrower name (bold) + loan amount
- Loan type badge (FHA/VA/Conventional/JUMBO)
- Days in stage chip: yellow >7d, red >14d
- Outstanding tasks count badge
- Assigned LO avatar

## Playwright Tests
```typescript
test.describe('F-PIPE-01', () => {
  test.use({ storageState: 'e2e/fixtures/loan-officer-auth.json' })
  test('pipeline kanban renders all stages', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.locator('text=Application')).toBeVisible()
    await expect(page.locator('text=Processing')).toBeVisible()
    await expect(page.locator('text=Underwriting')).toBeVisible()
  })
  test('loads under 2 seconds', async ({ page }) => {
    const start = Date.now()
    await page.goto('/pipeline')
    await page.waitForSelector('[data-testid="pipeline-kanban"]')
    expect(Date.now() - start).toBeLessThan(2000)
  })
  test('loan card shows health chips', async ({ page }) => {
    await page.goto('/pipeline')
    await expect(page.locator('[data-testid="days-in-stage"]').first()).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Kanban with 6 stages
- [ ] Drag-and-drop between stages (triggers transition modal)
- [ ] Filtering by LO, loan type, stage, close date
- [ ] Loan card health indicators
- [ ] Role-based view (LO sees own, manager sees team)
- [ ] Loads < 2 seconds for 500 active loans

---

# F-CREDIT-01 — Credit Report Integration
**PRD #5 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/013_credit_reports.sql
create table credit_reports (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  pull_type text not null check (pull_type in ('soft','hard','refresh')),
  borrower_consent_at timestamptz,
  experian_score int, equifax_score int, transunion_score int,
  trade_lines jsonb, derogatory_marks jsonb, inquiries jsonb, public_records jsonb,
  provider text, provider_reference_id text, raw_response jsonb,
  expires_at date,
  created_at timestamptz not null default now()
);

alter table credit_reports enable row level security;
create policy "borrower_own" on credit_reports for select
  using (loan_id in (select id from loans where borrower_id = auth.uid()));
create policy "staff_all" on credit_reports for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
create policy "hard_pull_consent_check" on credit_reports for insert
  with check (pull_type = 'soft' or (pull_type = 'hard' and borrower_consent_at is not null));
```

## Files to Create
```
lib/integrations/credit-bureau.ts
lib/services/credit-reports.ts
app/(app)/loans/[loanId]/credit/page.tsx
components/credit/
├── credit-score-display.tsx
├── score-gauge.tsx
├── trade-lines-table.tsx
├── derogatory-marks-list.tsx
├── credit-pull-consent-modal.tsx
└── pull-credit-button.tsx
actions/credit.ts
```

## UI Spec
- Tri-merge: 3 bureau score cards side by side, middle score highlighted/larger
- Score gauge: arc meter, color: <620 red → 800+ green
- Consent modal: plain-language text + checkbox before hard pull

## Acceptance Criteria
- [ ] Hard pull requires borrower consent
- [ ] Tri-merge display with middle score highlighted
- [ ] Trade lines, derogatories, inquiries
- [ ] Score change alert on re-pull
- [ ] Report within 30 seconds
- [ ] No raw PII in logs

---

# F-COMM-01 — Communication Hub
**PRD #9 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/014_messages.sql
create table message_threads (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  subject text,
  created_at timestamptz not null default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads(id) on delete cascade,
  loan_id uuid not null references loans(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (char_length(body) >= 1),
  is_template boolean default false, template_type text,
  attachments jsonb, read_by uuid[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table message_threads enable row level security;
alter table messages enable row level security;
create policy "loan_party_threads" on message_threads for all
  using (loan_id in (select id from loans where borrower_id = auth.uid() or loan_officer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role in ('processor','underwriter','admin')));
create policy "loan_party_messages" on messages for all
  using (loan_id in (select id from loans where borrower_id = auth.uid() or loan_officer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role in ('processor','underwriter','admin')));
```

## Files to Create
```
app/(app)/loans/[loanId]/messages/page.tsx
components/messaging/
├── message-thread.tsx
├── message-bubble.tsx
├── message-input.tsx
├── message-templates-dropdown.tsx
└── unread-badge.tsx
hooks/use-messages.ts
actions/messages.ts
```

## Acceptance Criteria
- [ ] Real-time via Supabase Realtime (no refresh needed)
- [ ] Thread-based linked to loan file
- [ ] Message templates
- [ ] Unread badge on nav
- [ ] All messages retained 7 years (soft delete only)
- [ ] Delivery < 5 seconds

---

# F-TASK-01 — Task Management & Workflows
**PRD #10 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/005_tasks.sql
create type task_status as enum ('pending','in_progress','completed','overdue','cancelled');
create type task_priority as enum ('low','medium','high','urgent');

create table workflow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null, loan_type text, stage text not null,
  tasks jsonb not null, is_active boolean default true,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  assigned_to uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  title text not null check (char_length(title) >= 1),
  description text,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  due_date timestamptz, completed_at timestamptz,
  depends_on uuid references tasks(id),
  workflow_template_id uuid references workflow_templates(id),
  sla_hours int default 24,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_loan_status on tasks (loan_id, status) where deleted_at is null;
alter table tasks enable row level security;
alter table workflow_templates enable row level security;
create policy "staff_all_tasks" on tasks for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','underwriter','admin')));
```

## Files to Create
```
app/(app)/loans/[loanId]/tasks/page.tsx
app/(app)/my-tasks/page.tsx
components/tasks/
├── task-list.tsx
├── task-card.tsx
├── task-create-form.tsx
├── task-detail-modal.tsx
├── task-status-badge.tsx
├── sla-timer.tsx
└── workflow-template-selector.tsx
inngest/functions/auto-assign-tasks.ts
inngest/functions/escalate-overdue-tasks.ts
actions/tasks.ts
```

## Acceptance Criteria
- [ ] Workflow templates per loan type + stage
- [ ] Tasks auto-created on stage transition via Inngest
- [ ] Task dependencies (B unlocks when A complete)
- [ ] SLA countdown timer
- [ ] Overdue escalation to manager (hourly Inngest job)
- [ ] My Tasks view per user

---

# F-PRICE-01 — Loan Pricing Engine
**PRD #13 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/015_pricing.sql
create table rate_sheets (
  id uuid primary key default gen_random_uuid(),
  name text not null, loan_type text not null,
  effective_date date not null, expiry_date date,
  is_active boolean default true, rate_matrix jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table rate_quotes (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  credit_score int, ltv_ratio numeric(5,2), loan_amount numeric(12,2),
  loan_type text, lock_period_days int,
  rate numeric(5,3), apr numeric(5,3), points numeric(4,3),
  monthly_payment numeric(10,2), fees_itemized jsonb,
  rate_sheet_id uuid references rate_sheets(id),
  locked_at timestamptz, lock_expiry_at timestamptz,
  quoted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table rate_sheets enable row level security;
alter table rate_quotes enable row level security;
create policy "staff_rates" on rate_sheets for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','admin')));
```

## Files to Create
```
app/(app)/loans/[loanId]/pricing/page.tsx
app/(app)/settings/rate-sheets/page.tsx
components/pricing/
├── rate-calculator.tsx
├── rate-comparison-table.tsx
├── rate-lock-button.tsx
├── fee-itemization.tsx
└── monthly-payment-breakdown.tsx
lib/services/pricing.ts
lib/utils/mortgage-calculator.ts
actions/pricing.ts
```

## Mortgage Calculator (lib/utils/mortgage-calculator.ts)
```typescript
export function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const r = annualRate / 100 / 12, n = termYears * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}
```

## Acceptance Criteria
- [ ] Rate returned within 3 seconds (debounced input)
- [ ] 30yr/15yr/ARM comparison table
- [ ] Fee itemization per TRID sections
- [ ] Rate lock request + confirmation
- [ ] All quotes audit-logged with inputs + timestamp

---

# F-3P-01 — Third-Party Service Ordering
**PRD #14 | Complexity: Medium | Must-Have**

## Database Migration
```sql
-- supabase/migrations/016_third_party.sql
create table service_orders (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  service_type text not null check (service_type in ('appraisal','title_search','flood_certification','pest_inspection','survey','closing_protection')),
  vendor_name text, vendor_contact text, vendor_order_id text,
  status text not null default 'pending' check (status in ('pending','submitted','in_progress','completed','cancelled','on_hold')),
  ordered_at timestamptz, expected_completion_at timestamptz, completed_at timestamptz,
  fee_amount numeric(10,2), invoice_number text,
  result_document_id uuid references documents(id),
  notes text, ordered_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table service_orders enable row level security;
create policy "staff_orders" on service_orders for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('loan_officer','processor','admin')));
```

## Acceptance Criteria
- [ ] Order services without leaving loan file
- [ ] Vendor panel management
- [ ] Order status synced from vendor
- [ ] Invoice fee logged against loan estimate
- [ ] Condition auto-cleared when service result received

---
---

# PHASE 4 — MUST-HAVE LOW COMPLEXITY
---

# F-STATUS-01 — Real-Time Application Status Tracking
**PRD #8 | Complexity: Low | Must-Have**

## Files to Create
```
app/(app)/my-loans/page.tsx
app/(app)/my-loans/[loanId]/page.tsx
app/(app)/my-loans/[loanId]/loading.tsx
components/status/
├── milestone-tracker.tsx
├── action-items-list.tsx
├── loan-activity-timeline.tsx
├── estimated-close-date-card.tsx
└── next-steps-card.tsx
```

## Milestone Stages (Borrower Labels)
```
Application Submitted → Documents Reviewed → Credit Checked → Appraised → Underwriting → Approved → Closing Scheduled → Closed!
```

## Playwright Tests
```typescript
test.describe('F-STATUS-01', () => {
  test.use({ storageState: 'e2e/fixtures/borrower-auth.json' })
  test('my loans page shows loan cards', async ({ page }) => {
    await page.goto('/my-loans')
    await expect(page.locator('[data-testid="loan-status-card"]')).toBeVisible()
  })
  test('milestone tracker shows active stage', async ({ page }) => {
    await page.goto('/my-loans/[testLoanId]')
    await expect(page.locator('[data-testid="milestone-tracker"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-milestone"]')).toBeVisible()
  })
  test('action items prominently displayed', async ({ page }) => {
    await page.goto('/my-loans/[testLoanId]')
    await expect(page.locator('[data-testid="action-items"]')).toBeVisible()
  })
})
```

## Acceptance Criteria
- [ ] Milestone tracker with current stage highlighted
- [ ] Action items with clear CTAs ("Upload your W-2")
- [ ] Activity timeline
- [ ] Status updates within 5 minutes via Supabase Realtime
- [ ] Push/email notifications on stage change (Inngest + Resend)

---

# F-ESIGN-01 — Electronic Signatures
**PRD #12 | Complexity: Low | Must-Have**

## Database Migration
```sql
-- supabase/migrations/017_esign.sql
create table signing_envelopes (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  provider text not null default 'docusign',
  provider_envelope_id text,
  subject text not null,
  status text not null default 'pending' check (status in ('pending','sent','partially_signed','completed','declined','voided','expired')),
  documents jsonb not null,
  signatories jsonb not null,
  sent_at timestamptz, completed_at timestamptz, expires_at timestamptz,
  void_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table signing_envelopes enable row level security;
create policy "loan_party_envelopes" on signing_envelopes for select
  using (loan_id in (select id from loans where borrower_id = auth.uid() or loan_officer_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role in ('processor','admin')));
```

## Files to Create
```
lib/integrations/docusign.ts
app/(app)/loans/[loanId]/signing/page.tsx
app/api/webhooks/docusign/route.ts
components/esign/
├── envelope-list.tsx
├── envelope-card.tsx
├── signing-status-badge.tsx
├── create-envelope-form.tsx
├── signatory-list.tsx
└── completion-certificate.tsx
inngest/functions/send-signing-reminder.ts
actions/signing.ts
```

## Acceptance Criteria
- [ ] ESIGN + UETA compliant
- [ ] DocuSign envelope create/send/status via webhook
- [ ] Multi-party signing in correct order
- [ ] Reminder after 24h inactivity (Inngest)
- [ ] Completed document stored back to loan file
- [ ] Webhook HMAC verified

---
---

# PHASE 5 — IMPORTANT FEATURES
---

# F-CRM-01 — Loan Officer CRM
**PRD #15 | Complexity: Medium**

## Database Migration
```sql
-- supabase/migrations/018_crm.sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  loan_officer_id uuid not null references auth.users(id),
  first_name text not null, last_name text not null,
  email text, phone text, notes text,
  status text not null default 'new' check (status in ('new','contacted','qualified','application_started','converted','lost','dormant')),
  source text not null default 'other' check (source in ('referral','website','social_media','realtor','direct','marketing_campaign','other')),
  estimated_loan_amount numeric(12,2), estimated_close_date date,
  referral_partner_id uuid references auth.users(id),
  converted_loan_id uuid references loans(id),
  last_contact_at timestamptz, next_followup_at timestamptz,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  performed_by uuid not null references auth.users(id),
  activity_type text not null,
  notes text, completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
alter table lead_activities enable row level security;
create policy "lo_own_leads" on leads for all
  using (loan_officer_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
```

## Files to Create
```
app/(app)/crm/page.tsx
app/(app)/crm/leads/page.tsx
app/(app)/crm/leads/[leadId]/page.tsx
components/crm/
├── leads-table.tsx
├── lead-card.tsx
├── lead-status-badge.tsx
├── lead-activity-timeline.tsx
├── add-lead-form.tsx
├── convert-to-application-button.tsx
└── follow-up-scheduler.tsx
```

## Acceptance Criteria
- [ ] Lead list with status/source/amount
- [ ] Activity timeline (calls, emails, notes)
- [ ] Follow-up scheduling with Inngest reminders
- [ ] One-click convert lead → loan application
- [ ] Referral partner tracking

---

# F-ANALYTICS-01 — Analytics & Reporting Dashboard
**PRD #17 | Complexity: Medium**

## Files to Create
```
app/(app)/analytics/page.tsx
app/(app)/analytics/loading.tsx
components/analytics/
├── pipeline-velocity-chart.tsx
├── pull-through-funnel.tsx
├── team-productivity-table.tsx
├── loan-volume-chart.tsx
├── avg-processing-time-card.tsx
├── compliance-rate-card.tsx
└── date-range-picker.tsx
lib/services/analytics.ts
```

## Key Metrics
```
Pipeline: total active, by stage, avg age per stage
Team: loans per LO, avg close time, pull-through rate
Volume: monthly loan count + amount (12-month Recharts line chart)
Compliance: % on-time disclosures, violation count
Processing: avg days application→approval→close
```

## Acceptance Criteria
- [ ] Dashboard loads < 3 seconds
- [ ] Date range filter (7d/30d/90d/YTD/custom)
- [ ] All charts use Recharts
- [ ] Export to CSV
- [ ] Role-based: LO sees own, manager sees team

---

# F-QC-01 — Quality Control Module
**PRD #21 | Complexity: Medium**

## Database Migration
```sql
-- supabase/migrations/019_quality_control.sql
create table qc_reviews (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  reviewer_id uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','in_progress','passed','failed','remediated')),
  review_type text not null default 'post_closing',
  checklist_completed jsonb, defects_found int default 0,
  hmda_data_verified boolean,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table qc_defects (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references qc_reviews(id) on delete cascade,
  loan_id uuid not null references loans(id),
  category text not null, description text not null,
  severity text not null check (severity in ('minor','significant','material','critical')),
  remediation_required text, remediated_at timestamptz,
  remediated_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table qc_reviews enable row level security;
alter table qc_defects enable row level security;
create policy "qc_staff" on qc_reviews for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Acceptance Criteria
- [ ] Post-closing QC checklist assignable to underwriters
- [ ] HMDA data audit per loan
- [ ] Defect tracking with severity
- [ ] Remediation workflow with due dates
- [ ] QC pass rate in analytics

---
---

# PHASE 6 — ADVANCED AI FEATURES
---

# F-AI-RISK-01 — AI-Powered Risk Assessment
**PRD A-01 | Complexity: High | Innovative**

## Database Migration
```sql
-- supabase/migrations/020_ai_risk.sql
create table risk_assessments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id) on delete cascade,
  model_version text not null,
  overall_risk_score numeric(5,3),
  risk_tier text check (risk_tier in ('excellent','good','fair','poor','high_risk')),
  traditional_score int,
  alt_data_score numeric(5,3),
  feature_importances jsonb,
  risk_factors jsonb,
  recommendation text check (recommendation in ('approve','manual_review','decline')),
  confidence numeric(4,3),
  model_explanation text,
  raw_features jsonb,
  created_at timestamptz not null default now()
);
alter table risk_assessments enable row level security;
create policy "uw_admin" on risk_assessments for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Files to Create
```
lib/services/ai-risk-assessment.ts
lib/integrations/alternative-data.ts
inngest/functions/run-risk-assessment.ts
app/(app)/loans/[loanId]/risk/page.tsx
components/ai-risk/
├── risk-score-gauge.tsx
├── risk-tier-badge.tsx
├── feature-importance-chart.tsx
├── risk-factors-list.tsx
├── model-explanation-panel.tsx
└── ai-recommendation-card.tsx
```

## Claude Explanation Integration
```typescript
export async function explainRiskAssessment(riskData: { overall_risk_score: number; risk_factors: unknown[]; traditional_score: number; recommendation: string }): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 400,
    system: `You are a mortgage underwriter explaining a risk assessment to a colleague. Be concise, factual. 2-3 sentences.`,
    messages: [{ role: 'user', content: `Risk score: ${riskData.overall_risk_score}. Traditional score: ${riskData.traditional_score}. Top factors: ${JSON.stringify(riskData.risk_factors?.slice(0,3))}. Recommendation: ${riskData.recommendation}.` }]
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

## Acceptance Criteria
- [ ] Risk score generated for every submitted loan (Inngest)
- [ ] Alternative data sources (rent, utility, cash flow)
- [ ] Feature importance chart
- [ ] Plain-language explanation via Claude
- [ ] Underwriters/admins only (not borrowers)
- [ ] Model version tracked

---

# F-AI-DOC-01 — Intelligent Document Processing (NLP)
**PRD A-03 | Complexity: High | Important**

## Files to Create
```
lib/services/intelligent-doc-processing.ts
inngest/functions/process-complex-document.ts
components/document-processing/
├── tax-return-summary.tsx
├── p-and-l-parser-results.tsx
└── trust-document-parser.tsx
```

## Extraction Prompts
```typescript
export const EXTRACTION_PROMPTS: Record<string, string> = {
  '1040': `Extract from this 1040 tax return: gross income, AGI, business income (Schedule C), rental income (Schedule E), tax year, taxpayer name. Return ONLY JSON.`,
  'p_and_l': `Extract from this P&L: business name, period, total revenue, total expenses, net income, owner compensation. Return ONLY JSON.`,
  'trust_document': `Extract: trust name, trustee(s), beneficiaries, date established, revocable/irrevocable, real property held. Return ONLY JSON.`,
}
```

## Acceptance Criteria
- [ ] P&L, 1040, 1120S/1065, trust docs
- [ ] Results feed F-INCOME-01
- [ ] Confidence score per field
- [ ] Low confidence → human review queue

---

# F-AI-FRAUD-01 — Advanced Fraud Detection
**PRD A-08 | Complexity: High | Important**

## Database Migration
```sql
-- supabase/migrations/021_fraud_detection.sql
create table fraud_assessments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  status text not null default 'clean' check (status in ('clean','suspicious','high_risk','confirmed_fraud')),
  overall_risk_score numeric(4,3),
  signals jsonb, patterns_detected jsonb,
  model_version text,
  escalated_to uuid references auth.users(id),
  escalated_at timestamptz, resolution text, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table fraud_assessments enable row level security;
create policy "uw_admin_only" on fraud_assessments for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Fraud Signal Types
```typescript
export const FRAUD_SIGNALS = {
  METADATA_INCONSISTENCY: 'Document creation date inconsistent with stated date',
  FONT_ANOMALY: 'Font characteristics inconsistent across document',
  ROUND_NUMBER_INCOME: 'Income figures suspiciously round',
  EMPLOYER_NOT_VERIFIABLE: 'Employer cannot be verified via public records',
  INCOME_VELOCITY: 'Income spike inconsistent with employment history',
  SAME_IP_MULTIPLE_APPS: 'Multiple applications from same IP address',
}
```

## Acceptance Criteria
- [ ] ML pattern recognition across all documents
- [ ] Cross-application pattern matching
- [ ] Fraud score underwriters/admins only
- [ ] High-risk auto-flagged and escalated
- [ ] SAR generation for confirmed fraud

---

# F-AI-RECCO-01 — Dynamic Loan Recommendation Engine
**PRD A-04 | Complexity: High | Important**

## Files to Create
```
lib/services/loan-recommendation.ts
app/(app)/apply/recommendations/page.tsx
components/recommendations/
├── recommendation-card.tsx
├── product-comparison-table.tsx
├── trade-off-explainer.tsx
└── why-recommended-panel.tsx
```

## Claude Integration
```typescript
export async function generateLoanRecommendations(borrowerProfile: Record<string, unknown>) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 1500,
    system: `You are a licensed mortgage advisor. Return ONLY valid JSON array. Never recommend products the borrower doesn't qualify for.`,
    messages: [{ role: 'user', content: `Profile: ${JSON.stringify(borrowerProfile)}. Products: conventional_30yr, conventional_15yr, fha_30yr, va_30yr (if eligible), usda (if eligible), jumbo. Return: [{product, eligible, rank, monthlyPayment, totalCost, pros, cons, whyRecommended}]` }]
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}
```

## Acceptance Criteria
- [ ] Shown after income step in loan application
- [ ] Eligibility correctly determined per product
- [ ] Trade-off table: payment vs total cost vs down payment
- [ ] Borrower can select and continue application

---

# F-AI-MARKET-01 — Real-Time Market Data Integration
**PRD A-07 | Complexity: Medium | Important**

## Database Migration
```sql
-- supabase/migrations/022_market_data.sql
create table market_rates (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  rate numeric(5,3) not null,
  points numeric(4,3),
  source text not null,
  recorded_at timestamptz not null default now()
);
create index idx_market_rates on market_rates (product, recorded_at desc);
```

## Files to Create
```
lib/integrations/market-data.ts
inngest/functions/fetch-market-rates.ts
app/(app)/market-rates/page.tsx
components/market/
├── rate-trend-chart.tsx
└── current-rate-display.tsx
```

## Acceptance Criteria
- [ ] Daily market rate fetch (Inngest scheduled)
- [ ] 30-day rate trend chart
- [ ] Quote vs market comparison
- [ ] Alert when market moves > 0.25%

---

# F-AI-REG-01 — Regulatory Change Management
**PRD A-11 | Complexity: Medium | Important**

## Database Migration
```sql
-- supabase/migrations/023_regulatory.sql
create table regulatory_updates (
  id uuid primary key default gen_random_uuid(),
  regulation text not null,
  title text not null, summary text not null,
  effective_date date not null,
  impact_analysis text, affected_loans_count int, action_required text,
  status text not null default 'pending' check (status in ('pending','acknowledged','implemented')),
  source_url text,
  created_at timestamptz not null default now()
);
```

## Acceptance Criteria
- [ ] Weekly job checks CFPB and state regulator feeds
- [ ] Impact analysis on in-flight loans
- [ ] Admin notified of changes requiring rule updates
- [ ] Compliance rules version-controlled with effective dates

---

# F-AI-PREDICT-01 — Predictive Loan Performance
**PRD A-02 | Complexity: High | Innovative**

## Database Migration
```sql
-- supabase/migrations/024_predictions.sql
create table loan_performance_predictions (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  default_probability numeric(4,3),
  prepayment_probability numeric(4,3),
  expected_life_months int,
  recommended_rate_adjustment numeric(4,3),
  confidence numeric(4,3), feature_snapshot jsonb, model_version text,
  created_at timestamptz not null default now()
);
alter table loan_performance_predictions enable row level security;
create policy "uw_admin" on loan_performance_predictions for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('underwriter','admin')));
```

## Acceptance Criteria
- [ ] Default probability with confidence interval
- [ ] Prepayment probability for ARMs
- [ ] Pricing recommendation based on risk
- [ ] Prediction history for model accuracy tracking

---

# F-AI-INVESTOR-01 — Investor / Secondary Market Integration
**PRD A-12 | Complexity: High | Important**

## Database Migration
```sql
-- supabase/migrations/025_secondary_market.sql
create table investor_commitments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  investor text not null,
  commitment_number text,
  purchase_price numeric(12,2), rate_differential numeric(5,3),
  delivery_deadline date, delivered_at timestamptz,
  status text not null default 'pending' check (status in ('pending','committed','delivered','purchased','failed')),
  mismo_package_path text,
  created_at timestamptz not null default now()
);
```

## Acceptance Criteria
- [ ] MISMO 3.4 XML package generation
- [ ] Fannie Mae MORNET integration
- [ ] Freddie Mac Selling System integration
- [ ] Delivery tracking and confirmation
- [ ] Purchase price reconciliation

---

# F-AI-PORTFOLIO-01 — Advanced Portfolio Analytics
**PRD A-13 | Complexity: High | Important**

## Files to Create
```
app/(app)/portfolio/page.tsx
components/portfolio/
├── concentration-risk-chart.tsx
├── delinquency-rate-chart.tsx
├── vintage-analysis-chart.tsx
├── portfolio-summary-stats.tsx
└── risk-heatmap.tsx
lib/services/portfolio-analytics.ts
```

## Acceptance Criteria
- [ ] Geographic concentration map
- [ ] LTV distribution histogram
- [ ] Vintage analysis (cohort performance curves)
- [ ] Delinquency rate trends
- [ ] Concentration risk alerts (>30% in one ZIP)

---

# F-AI-CLOSE-01 — Automated Closing Coordination
**PRD A-09 | Complexity: High | Important**

## Files to Create
```
lib/integrations/google-calendar.ts
inngest/functions/coordinate-closing.ts
app/(app)/loans/[loanId]/closing/page.tsx
components/closing/
├── closing-scheduler.tsx
├── pre-closing-checklist.tsx
├── closing-confirmation-card.tsx
└── day-of-guide.tsx
```

## Acceptance Criteria
- [ ] Calendar integration (Google Calendar)
- [ ] All parties notified of scheduled closing
- [ ] Pre-closing checklist from conditions
- [ ] Day-of reminders (SMS + email via Inngest + Resend)
- [ ] Documents pre-packaged for settlement agent

---
---

# GLOBAL ENVIRONMENT VARIABLES

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=
LLAMA_CLOUD_API_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
RESEND_API_KEY=
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_CLIENT_SECRET=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_WEBHOOK_SECRET=
ARGYLE_CLIENT_ID=
ARGYLE_CLIENT_SECRET=
PINWHEEL_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

# RECOMMENDED EXECUTION ORDER

```
Phase 1:  F-AUTH-01 → F-AUTH-02 → F-AUTH-03 → F-SHELL-01
Phase 2:  F-LOAN-01 → F-DOC-01 → F-DOC-02 → F-INCOME-01
Phase 3:  F-UW-01 → F-COMP-01 → F-DISC-01
Phase 4:  F-PIPE-01 → F-TASK-01 → F-COMM-01
Phase 5:  F-CREDIT-01 → F-PRICE-01 → F-3P-01
Phase 6:  F-STATUS-01 → F-ESIGN-01
Phase 7:  F-HUB-01 → F-CRM-01 → F-ANALYTICS-01 → F-QC-01
Phase 8:  F-AI-DOC-01 → F-AI-RISK-01 → F-AI-FRAUD-01
Phase 9:  F-AI-RECCO-01 → F-AI-MARKET-01 → F-AI-REG-01
Phase 10: F-AI-PREDICT-01 → F-AI-INVESTOR-01 → F-AI-PORTFOLIO-01 → F-AI-CLOSE-01
```