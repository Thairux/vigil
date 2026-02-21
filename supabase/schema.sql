create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text unique not null,
  role text not null default 'customer' check (role in ('admin', 'analyst', 'customer')),
  avatar text,
  device text,
  location text,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists auth_user_id uuid;
alter table public.users add column if not exists role text default 'customer';
create unique index if not exists idx_users_auth_user_id on public.users(auth_user_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check check (role in ('admin', 'analyst', 'customer'));
  end if;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  amount numeric(12, 2) not null default 0,
  risk_score int not null,
  risk_band text not null check (risk_band in ('low', 'medium', 'high', 'critical')),
  is_risky boolean not null default false,
  reason text,
  device text,
  location text,
  status text not null check (status in ('clear', 'flagged')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  risk_score int not null,
  risk_band text not null check (risk_band in ('low', 'medium', 'high', 'critical')),
  reason text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  is_read boolean not null default false,
  assigned_to uuid references public.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  recipient text not null,
  amount numeric(12, 2) not null,
  type text not null,
  device text,
  location text,
  risk_score int not null,
  risk_band text not null check (risk_band in ('low', 'medium', 'high', 'critical')),
  status text not null check (status in ('approved', 'flagged')),
  created_at timestamptz not null default now()
);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_created_at on public.events(created_at desc);
create index if not exists idx_alerts_status on public.alerts(status);
create index if not exists idx_alerts_created_at on public.alerts(created_at desc);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
