create table hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table hero_slides enable row level security;
create policy "Public read hero_slides" on hero_slides for select using (true);
