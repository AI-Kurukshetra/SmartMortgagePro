alter table public.documents enable row level security;

drop policy if exists "Borrowers and staff can read accessible documents" on public.documents;
create policy "Borrowers and staff can read accessible documents"
  on public.documents for select
  to authenticated
  using (
    exists (
      select 1
      from public.loan_applications
      where id = documents.loan_id
        and deleted_at is null
        and (
          borrower_id = auth.uid()
          or loan_officer_id = auth.uid()
          or exists (
            select 1
            from public.profiles
            where id = auth.uid()
              and role in ('loan_officer', 'processor', 'underwriter', 'admin')
          )
        )
    )
  );

drop policy if exists "Borrowers and staff can upload accessible documents" on public.documents;
create policy "Borrowers and staff can upload accessible documents"
  on public.documents for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1
      from public.loan_applications
      where id = documents.loan_id
        and deleted_at is null
        and (
          borrower_id = auth.uid()
          or loan_officer_id = auth.uid()
          or exists (
            select 1
            from public.profiles
            where id = auth.uid()
              and role in ('loan_officer', 'processor', 'underwriter', 'admin')
          )
        )
    )
  );

drop policy if exists "Staff can update documents" on public.documents;
create policy "Staff can update documents"
  on public.documents for update
  to authenticated
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

drop policy if exists "Staff can delete documents" on public.documents;
create policy "Staff can delete documents"
  on public.documents for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('loan_officer', 'processor', 'underwriter', 'admin')
    )
  );
