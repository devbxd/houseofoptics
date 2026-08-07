create table testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  quote text not null,
  rating integer check (rating is null or (rating between 1 and 5)),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;
create policy "public read testimonials" on testimonials for select using (is_active = true);
