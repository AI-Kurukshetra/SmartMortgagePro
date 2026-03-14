alter table public.loan_applications
  add column if not exists borrower_id uuid references auth.users(id) on delete set null,
  add column if not exists loan_officer_id uuid references auth.users(id) on delete set null;

create index if not exists idx_loan_applications_borrower_id
  on public.loan_applications (borrower_id)
  where deleted_at is null;

create index if not exists idx_loan_applications_loan_officer_id
  on public.loan_applications (loan_officer_id)
  where deleted_at is null;

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  subject text,
  thread_type text not null default 'general' check (
    thread_type in ('general', 'document_request', 'status_update', 'approval_notice', 'custom')
  ),
  created_by uuid not null references auth.users(id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  loan_id uuid not null references public.loan_applications(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  sender_role text not null check (
    sender_role in ('borrower', 'loan_officer', 'processor', 'underwriter', 'admin')
  ),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  is_template boolean not null default false,
  template_type text check (
    template_type in ('general', 'document_request', 'status_update', 'approval_notice', 'custom')
  ),
  read_by uuid[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_message_threads_loan_updated
  on public.message_threads (loan_id, updated_at desc)
  where archived_at is null;

create index if not exists idx_messages_thread_created
  on public.messages (thread_id, created_at asc)
  where deleted_at is null;

create index if not exists idx_messages_loan_created
  on public.messages (loan_id, created_at desc)
  where deleted_at is null;

create index if not exists idx_messages_read_by
  on public.messages using gin (read_by);

create or replace function public.set_message_thread_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_message_threads_updated_at on public.message_threads;

create trigger trg_message_threads_updated_at
before update on public.message_threads
for each row
execute function public.set_message_thread_updated_at();

create or replace function public.bump_message_thread_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.message_threads
  set updated_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_bump_thread on public.messages;

create trigger trg_messages_bump_thread
after insert on public.messages
for each row
execute function public.bump_message_thread_updated_at();

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users can view loan threads" on public.message_threads;
create policy "Users can view loan threads"
  on public.message_threads for select
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('processor', 'underwriter', 'admin')
    )
    or exists (
      select 1
      from public.loan_applications
      where id = message_threads.loan_id
        and deleted_at is null
        and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
    )
  );

drop policy if exists "Users can create loan threads" on public.message_threads;
create policy "Users can create loan threads"
  on public.message_threads for insert
  with check (
    created_by = auth.uid()
    and (
      exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role in ('processor', 'underwriter', 'admin')
      )
      or exists (
        select 1
        from public.loan_applications
        where id = message_threads.loan_id
          and deleted_at is null
          and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
      )
    )
  );

drop policy if exists "Users can view loan messages" on public.messages;
create policy "Users can view loan messages"
  on public.messages for select
  using (
    deleted_at is null
    and (
      exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role in ('processor', 'underwriter', 'admin')
      )
      or exists (
        select 1
        from public.loan_applications
        where id = messages.loan_id
          and deleted_at is null
          and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
      )
    )
  );

drop policy if exists "Users can send loan messages" on public.messages;
create policy "Users can send loan messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role in ('processor', 'underwriter', 'admin')
      )
      or exists (
        select 1
        from public.loan_applications
        where id = messages.loan_id
          and deleted_at is null
          and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
      )
    )
  );

drop policy if exists "Users can update message read state" on public.messages;
create policy "Users can update message read state"
  on public.messages for update
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('processor', 'underwriter', 'admin')
    )
    or exists (
      select 1
      from public.loan_applications
      where id = messages.loan_id
        and deleted_at is null
        and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('processor', 'underwriter', 'admin')
    )
    or exists (
      select 1
      from public.loan_applications
      where id = messages.loan_id
        and deleted_at is null
        and (borrower_id = auth.uid() or loan_officer_id = auth.uid())
    )
  );

alter table public.message_threads replica identity full;
alter table public.messages replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.message_threads;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.messages;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;
