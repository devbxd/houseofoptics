create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending_payment', -- pending_payment | confirmed | cancelled
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null default 1
);

create index order_items_order_id_idx on order_items(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Guests can create orders (checkout), but only the admin (service role) can read them.
create policy "public insert orders" on orders for insert with check (true);
create policy "public insert order_items" on order_items for insert with check (true);
