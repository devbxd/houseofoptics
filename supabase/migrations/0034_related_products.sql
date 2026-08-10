-- Manual "related sunglasses" picks per product — when present, these
-- override the automatic category/brand-based related products.
create table product_related_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, related_product_id)
);
create index product_related_products_product_id_idx on product_related_products(product_id);
