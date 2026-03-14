alter table public.loan_applications
  add column if not exists borrower_id uuid references auth.users(id) on delete set null,
  add column if not exists loan_officer_id uuid references auth.users(id) on delete set null;

create index if not exists idx_loan_applications_borrower_active
  on public.loan_applications (borrower_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_loan_applications_officer_active
  on public.loan_applications (loan_officer_id, created_at desc)
  where deleted_at is null;
