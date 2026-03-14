create type disclosure_type as enum (
  'loan_estimate',
  'closing_disclosure',
  'intent_to_proceed',
  'adverse_action',
  'appraisal_notice'
);

create type disclosure_status as enum (
  'draft',
  'generated',
  'sent',
  'acknowledged',
  'expired',
  'superseded'
);

create type fee_tolerance as enum ('zero', 'ten_percent', 'unlimited');

create table if not exists public.disclosures (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  type disclosure_type not null,
  status disclosure_status not null default 'draft',
  version int not null default 1 check (version > 0),
  issued_date timestamptz,
  due_date timestamptz,
  sent_to_borrower_at timestamptz,
  acknowledged_by_borrower_at timestamptz,
  acknowledgement_method text,
  fees_snapshot jsonb,
  loan_terms_snapshot jsonb,
  state text,
  file_path text,
  generated_by uuid references auth.users(id),
  supersedes_id uuid references public.disclosures(id),
  change_of_circumstance_reason text,
  change_of_circumstance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disclosure_fees (
  id uuid primary key default gen_random_uuid(),
  disclosure_id uuid not null references public.disclosures(id) on delete cascade,
  fee_name text not null check (char_length(fee_name) between 1 and 120),
  fee_category text not null check (char_length(fee_category) between 1 and 120),
  tolerance_type fee_tolerance not null,
  le_amount numeric(10, 2),
  cd_amount numeric(10, 2)
);

create index if not exists idx_disclosures_loan_type_created_at
  on public.disclosures (loan_id, type, created_at desc);

create index if not exists idx_disclosures_status_due_date
  on public.disclosures (status, due_date);

create index if not exists idx_disclosure_fees_disclosure
  on public.disclosure_fees (disclosure_id);

create or replace function public.set_disclosure_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_disclosures_updated_at on public.disclosures;

create trigger trg_disclosures_updated_at
before update on public.disclosures
for each row
execute function public.set_disclosure_updated_at();
