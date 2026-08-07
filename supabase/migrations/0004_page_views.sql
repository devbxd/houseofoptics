create table page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now()
);

create index page_views_created_at_idx on page_views(created_at);

alter table page_views enable row level security;
create policy "public insert page_views" on page_views for insert with check (true);
