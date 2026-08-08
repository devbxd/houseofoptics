-- Sub-categories
alter table categories add column parent_id uuid references categories(id) on delete set null;
create index categories_parent_id_idx on categories(parent_id);

-- Brands (Ray-Ban, Gucci, etc.) — a separate taxonomy from categories
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table brands enable row level security;
create policy "public read brands" on brands for select using (true);

alter table products add column brand_id uuid references brands(id) on delete set null;
create index products_brand_id_idx on products(brand_id);

-- Site theme colors, editable from the dashboard
alter table site_settings add column accent_color text not null default '#c8102e';
alter table site_settings add column dark_color text not null default '#111111';

-- Manual hero carousel image selection
alter table product_images add column is_hero boolean not null default false;
alter table product_images add column hero_order integer;
