create table if not exists public.roles (
  id bigserial primary key,
  key text not null unique check (
    key in ('borrower', 'loan_officer', 'processor', 'underwriter', 'admin')
  ),
  label text not null,
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.roles (key, label, is_staff)
values
  ('borrower', 'Borrower', false),
  ('loan_officer', 'Loan Officer', true),
  ('processor', 'Processor', true),
  ('underwriter', 'Underwriter', true),
  ('admin', 'Admin', true)
on conflict (key) do update
set
  label = excluded.label,
  is_staff = excluded.is_staff;

alter table public.roles enable row level security;

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
  on public.roles for select
  using (auth.uid() is not null);

update public.profiles
set role = 'borrower'
where role not in (select key from public.roles);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_fkey
      foreign key (role) references public.roles(key);
  end if;
end
$$;

alter table public.loan_applications enable row level security;

drop policy if exists "Borrowers can read own loans" on public.loan_applications;
create policy "Borrowers can read own loans"
  on public.loan_applications for select
  using (
    deleted_at is null
    and borrower_id = auth.uid()
  );

drop policy if exists "Loan officers can read assigned loans" on public.loan_applications;
create policy "Loan officers can read assigned loans"
  on public.loan_applications for select
  using (
    deleted_at is null
    and loan_officer_id = auth.uid()
  );

drop policy if exists "Staff can read all active loans" on public.loan_applications;
create policy "Staff can read all active loans"
  on public.loan_applications for select
  using (
    deleted_at is null
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('processor', 'underwriter', 'admin')
    )
  );

drop policy if exists "Staff can create loans" on public.loan_applications;
create policy "Staff can create loans"
  on public.loan_applications for insert
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (
          role in ('processor', 'underwriter', 'admin')
          or (role = 'loan_officer' and (loan_officer_id is null or loan_officer_id = auth.uid()))
        )
    )
  );

drop policy if exists "Staff can update loans" on public.loan_applications;
create policy "Staff can update loans"
  on public.loan_applications for update
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (
          role in ('processor', 'underwriter', 'admin')
          or (role = 'loan_officer' and loan_officer_id = auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (
          role in ('processor', 'underwriter', 'admin')
          or (role = 'loan_officer' and loan_officer_id = auth.uid())
        )
    )
  );
