alter table site_settings add column spin_wheel_enabled boolean not null default false;

create table spin_wheel_wins (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  discount_percent integer not null,
  code text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table spin_wheel_wins enable row level security;
create policy "public insert spin_wheel_wins" on spin_wheel_wins for insert with check (true);
