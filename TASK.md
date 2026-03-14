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
| F-DOC-02 | Auto Document Categorization | MVP | 🔲 TODO | F-03 |
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
- [x] Forgot password page accessible from login page link
- [x] Email validation before submission
- [x] Success state shown after email sent
- [x] Reset password page validates new password ≥ 8 chars
- [x] Passwords match validation on reset form
- [x] After reset, user redirected to login with success message

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
