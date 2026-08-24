-- "Notify me when back in stock": a customer leaves their email on an
-- out-of-stock product (or a specific color/size variant of it); when an
-- admin brings that same product/variant back above zero stock, everyone
-- waiting on it gets an email and their row is cleared (see
-- lib/notify-stock.ts and the restock checks in app/admin/produits/actions.ts).
create table stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_color_label text,
  variant_size_label text,
  email text not null,
  created_at timestamptz not null default now()
);
create index stock_notifications_product_id_idx on stock_notifications(product_id);
-- Same email can't sign up twice for the exact same product/variant —
-- coalesce so two null variant labels (a plain product with no variants)
-- still collide instead of each NULL comparing as distinct.
create unique index stock_notifications_unique_idx on stock_notifications (
  product_id, coalesce(variant_color_label, ''), coalesce(variant_size_label, ''), lower(email)
);
alter table stock_notifications enable row level security;
create policy "public insert stock_notifications" on stock_notifications for insert with check (true);
