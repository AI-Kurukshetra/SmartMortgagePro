create extension if not exists pgcrypto;

create table if not exists public.loan_applications (
  id uuid primary key default gen_random_uuid(),
  borrower_name text not null check (char_length(borrower_name) between 2 and 120),
  property_address text not null check (char_length(property_address) between 5 and 240),
  loan_amount numeric(14, 2) not null check (loan_amount > 0),
  stage text not null default 'application' check (
    stage in ('application', 'processing', 'underwriting', 'approved', 'closing')
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high')
  ),
  expected_close_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loan_applications_stage_active
  on public.loan_applications (stage)
  where deleted_at is null;

create index if not exists idx_loan_applications_priority_active
  on public.loan_applications (priority)
  where deleted_at is null;

create index if not exists idx_loan_applications_created_at_active
  on public.loan_applications (created_at desc)
  where deleted_at is null;

create or replace function public.set_loan_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_loan_applications_updated_at on public.loan_applications;

create trigger trg_loan_applications_updated_at
before update on public.loan_applications
for each row
execute function public.set_loan_updated_at();
