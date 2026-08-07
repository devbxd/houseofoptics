alter table products add column stock integer;

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  stock integer,
  sort_order integer not null default 0
);

create index product_variants_product_id_idx on product_variants(product_id);

alter table product_variants enable row level security;
create policy "public read product_variants" on product_variants for select using (true);

alter table order_items add column variant_label text;
