-- "New Product" category: the admin flags one existing category (already
-- created by hand in Admin > Categories) as the auto-expiring bucket. From
-- a product's edit page, a dedicated button links/unlinks that product to
-- it — separate from the product's normal category_id/brand_id, which are
-- untouched. A product stays listed under that category for 15 days after
-- being added, computed from new_product_added_at at query time (no cron).
alter table categories add column is_new_product_category boolean not null default false;

-- Only one category can be "the" New Product bucket at a time.
create unique index categories_new_product_flag_idx on categories (is_new_product_category) where is_new_product_category;

alter table products add column new_product_added_at timestamptz;
