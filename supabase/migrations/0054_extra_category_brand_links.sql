-- Generic "quick add" tagging: from a product's edit page, link it into
-- extra categories/brands beyond its main category_id/brand_id (which stay
-- untouched). New Drop is just a regular category using this table, with
-- its 15-day window computed in application code from added_at.
create table product_category_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (product_id, category_id)
);
create index product_category_links_product_id_idx on product_category_links(product_id);
create index product_category_links_category_id_idx on product_category_links(category_id);
alter table product_category_links enable row level security;
create policy "public read product_category_links" on product_category_links for select using (true);

create table product_brand_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  brand_id uuid not null references brands(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (product_id, brand_id)
);
create index product_brand_links_product_id_idx on product_brand_links(product_id);
create index product_brand_links_brand_id_idx on product_brand_links(brand_id);
alter table product_brand_links enable row level security;
create policy "public read product_brand_links" on product_brand_links for select using (true);

-- Manual per-category image — lets the admin set a photo for categories
-- with no single representative product (e.g. "All Brands"), used on the
-- homepage tile instead of the auto-derived product photo.
alter table categories add column image_url text;

-- Carry over products already added to New Drop under the old mechanism.
insert into product_category_links (product_id, category_id, added_at)
select p.id, c.id, p.new_product_added_at
from products p, categories c
where c.slug = 'new-drop' and p.new_product_added_at is not null
on conflict (product_id, category_id) do nothing;
