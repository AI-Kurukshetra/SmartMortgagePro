create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  regulation text not null check (
    regulation in ('trid', 'respa', 'hmda', 'ecoa', 'fcra', 'glba', 'state', 'ada')
  ),
  check_name text not null check (char_length(trim(check_name)) between 3 and 160),
  status text not null default 'pending' check (
    status in ('pass', 'warning', 'violation', 'pending', 'waived')
  ),
  description text not null check (char_length(trim(description)) between 3 and 2000),
  remediation text,
  deadline timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  waived_by uuid references auth.users(id),
  waiver_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_events (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  event_type text not null check (char_length(trim(event_type)) between 3 and 120),
  event_date timestamptz not null default now(),
  performed_by uuid references auth.users(id),
  notes text,
  metadata jsonb
);

create table if not exists public.compliance_audit_log (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  action text not null check (char_length(trim(action)) between 3 and 160),
  performed_by uuid references auth.users(id),
  details jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_checks_loan_status
  on public.compliance_checks (loan_id, status, deadline asc nulls last);

create index if not exists idx_compliance_checks_regulation
  on public.compliance_checks (regulation, status);

create index if not exists idx_compliance_events_loan_date
  on public.compliance_events (loan_id, event_date desc);

create index if not exists idx_compliance_audit_log_loan_date
  on public.compliance_audit_log (loan_id, created_at desc);

create or replace function public.set_compliance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_compliance_checks_updated_at on public.compliance_checks;

create trigger trg_compliance_checks_updated_at
before update on public.compliance_checks
for each row
execute function public.set_compliance_updated_at();

alter table public.compliance_checks enable row level security;
alter table public.compliance_events enable row level security;
alter table public.compliance_audit_log enable row level security;

drop policy if exists "Staff can manage compliance checks" on public.compliance_checks;
create policy "Staff can manage compliance checks"
  on public.compliance_checks for all
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

drop policy if exists "Staff can manage compliance events" on public.compliance_events;
create policy "Staff can manage compliance events"
  on public.compliance_events for all
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

drop policy if exists "Staff can insert compliance audit entries" on public.compliance_audit_log;
create policy "Staff can insert compliance audit entries"
  on public.compliance_audit_log for insert
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );

drop policy if exists "Admins can view compliance audit entries" on public.compliance_audit_log;
create policy "Admins can view compliance audit entries"
  on public.compliance_audit_log for select
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('underwriter', 'admin')
    )
  );
