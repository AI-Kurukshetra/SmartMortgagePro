-- Create the documents storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50 MB
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users can upload to their own folder (userId/loanId/filename)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Authenticated users can upload documents'
  ) then
    create policy "Authenticated users can upload documents"
      on storage.objects for insert
      to authenticated
      with check (
        bucket_id = 'documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Users can read files they uploaded (first path segment = their uid)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Users can read own documents'
  ) then
    create policy "Users can read own documents"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'documents'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

-- Staff roles can read all documents
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Staff can read all documents'
  ) then
    create policy "Staff can read all documents"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'documents'
        and exists (
          select 1 from public.profiles
          where id = auth.uid()
            and role in ('loan_officer', 'processor', 'underwriter', 'admin')
        )
      );
  end if;
end $$;
