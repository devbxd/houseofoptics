-- Schema for the House of Optics catalog + admin dashboard.

create extension if not exists "pgcrypto";

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10, 2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  source text not null default 'manual', -- 'manual' | 'instagram_import'
  source_ref text, -- instagram post code, when imported
  created_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create table site_settings (
  id boolean primary key default true, -- single row table
  brand_name text not null default 'House of Optics',
  whatsapp_number text not null default '',
  contact_email text not null default '',
  instagram_handle text not null default 'house.of.optics',
  logo_url text,
  constraint site_settings_singleton check (id)
);
insert into site_settings (id) values (true);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);
create index product_images_product_id_idx on product_images(product_id);

-- Row Level Security: public read on catalog data, writes only via the
-- service-role key used by admin server actions (never exposed to the browser).
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table site_settings enable row level security;
alter table newsletter_subscribers enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (is_active = true);
create policy "public read product_images" on product_images for select using (true);
create policy "public read site_settings" on site_settings for select using (true);
create policy "public insert newsletter" on newsletter_subscribers for insert with check (true);
