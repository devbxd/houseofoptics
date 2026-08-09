create table popups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  discount_percent integer,
  max_uses integer,
  duration_days integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table popups enable row level security;
create policy "Public read popups" on popups for select using (true);
