-- Update the handle_new_user trigger to capture role from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
begin
  requested_role := new.raw_user_meta_data->>'role';

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case
      when requested_role in ('borrower', 'loan_officer', 'processor', 'underwriter', 'admin')
        then requested_role
      else 'borrower'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
