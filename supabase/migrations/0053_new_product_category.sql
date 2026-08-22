-- "New Drop" category: from a product's edit page, a dedicated button
-- links/unlinks that product to the existing "New Drop" category (slug
-- "new-drop", already created by hand in Admin > Categories) — separate
-- from the product's normal category_id/brand_id, which stay untouched. A
-- product stays listed under "New Drop" for 15 days after being added,
-- computed from new_product_added_at at query time (no cron needed).
alter table products add column new_product_added_at timestamptz;
