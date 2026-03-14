create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  category text not null default 'other' check (
    category in (
      'pay_stub',
      'w2',
      'bank_statement',
      'tax_return',
      'id_document',
      'employment_letter',
      'other'
    )
  ),
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_size int not null check (file_size > 0 and file_size <= 52428800),
  mime_type text not null,
  storage_path text not null unique,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'verified', 'rejected', 'expired')
  ),
  rejection_reason text,
  expires_at date,
  version int not null default 1 check (version > 0),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_loan_created_at_active
  on public.documents (loan_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_documents_status_active
  on public.documents (status)
  where deleted_at is null;

create or replace function public.set_document_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_documents_updated_at on public.documents;

create trigger trg_documents_updated_at
before update on public.documents
for each row
execute function public.set_document_updated_at();
