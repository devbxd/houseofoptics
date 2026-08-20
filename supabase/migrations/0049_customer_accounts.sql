-- Real customer accounts (Supabase Auth), separate from admin auth even
-- though they share the same auth.users table — see the app_metadata role
-- check this migration sets up below, which is what keeps a customer who
-- signs up from ever being treated as the admin.

create table if not exists customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);
alter table customer_profiles enable row level security;
create policy "customers manage their own profile" on customer_profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Wishlist moves from per-device localStorage to a real per-account table.
-- variant is stored as '' rather than null for "no variant" (matching the
-- (a.variant ?? "") convention already used for cart/wishlist keys
-- elsewhere in the app) — Postgres unique constraints treat every null as
-- distinct from every other null, which would otherwise let the same
-- no-variant product be wishlisted twice.
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant text not null default '',
  slug text not null,
  name text not null,
  price numeric(10,2),
  image text,
  stock integer,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id, variant)
);
alter table wishlist_items enable row level security;
create policy "customers manage their own wishlist" on wishlist_items
  for all
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

-- Links an order to the account that placed it (nullable — guest checkout
-- with a single item stays fully supported, see the >1-item gate in
-- checkout) and links a redeemed gift card to whoever redeemed it, so its
-- balance/history follows their account instead of one browser.
alter table orders add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table gift_cards add column if not exists customer_id uuid references auth.users(id) on delete set null;

-- ============================================================
-- IMPORTANT — run this too, with YOUR admin login email:
--
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
--   where email = 'your-admin-email@example.com';
--
-- Customer signups use the same auth.users table as the admin login.
-- app_metadata can only ever be set from the server with the service-role
-- key (never by a user signing themselves up), so checking it in
-- middleware is what keeps a customer account from being able to open
-- /admin. Without running the update above, the existing admin account
-- has no role set and would be locked out of /admin once this ships.
-- ============================================================
