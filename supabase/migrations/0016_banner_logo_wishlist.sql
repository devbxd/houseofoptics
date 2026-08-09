alter table site_settings add column announcement_text text not null default 'Nouveautés ajoutées chaque semaine';
alter table site_settings add column banner_color text not null default '#111111';

create table wishlist_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index wishlist_events_product_id_idx on wishlist_events(product_id);

alter table wishlist_events enable row level security;
create policy "public insert wishlist_events" on wishlist_events for insert with check (true);
