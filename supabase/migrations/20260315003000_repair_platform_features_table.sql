create table if not exists public.platform_features (
  id uuid primary key default gen_random_uuid(),
  feature_code text not null unique,
  feature_name text not null,
  summary text not null,
  category text not null default 'core' check (category in ('core', 'automation', 'ai')),
  audience text not null default 'both' check (audience in ('borrower', 'staff', 'both')),
  tier text not null default 'must_have' check (
    tier in ('must_have', 'important', 'innovative', 'nice_to_have')
  ),
  complexity text not null default 'medium' check (complexity in ('low', 'medium', 'high')),
  status text not null default 'planned' check (status in ('planned', 'seeded', 'in_progress', 'live')),
  owner_team text,
  route_href text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_platform_features_sort_order
  on public.platform_features (sort_order asc, feature_name asc);

create or replace function public.set_platform_feature_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_platform_features_updated_at on public.platform_features;

create trigger trg_platform_features_updated_at
before update on public.platform_features
for each row
execute function public.set_platform_feature_updated_at();
