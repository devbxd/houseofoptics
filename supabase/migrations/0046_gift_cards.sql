-- Gift cards issued by the admin: a free product, a discount percentage, or
-- a flat store-credit amount, redeemed by a customer entering a code.
-- No RLS policies are added on purpose (same posture as `orders` and
-- `spin_wheel_wins`) — every read/write goes through a Server Action using
-- the service-role key, never the anon client, so a code can't be listed or
-- brute-forced through the public Supabase API.
create table if not exists gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('product', 'discount', 'credit')),
  product_id uuid references products(id) on delete set null,
  discount_percent integer check (discount_percent is null or (discount_percent > 0 and discount_percent <= 100)),
  credit_amount numeric(10,2) check (credit_amount is null or credit_amount > 0),
  recipient_name text not null,
  message text,
  redeemed_at timestamptz,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table gift_cards enable row level security;

create index if not exists gift_cards_code_idx on gift_cards (code);
create index if not exists gift_cards_created_at_idx on gift_cards (created_at desc);

alter table orders add column if not exists gift_card_code text;
