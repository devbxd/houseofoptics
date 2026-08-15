-- Lets separate products be tagged as "other colors" of each other. All
-- products sharing the same color_group_id are shown to each other as color
-- swatches on the product page (see Admin > Products > edit product >
-- Other colors). No group table needed — the id itself defines the group.
alter table products add column color_group_id uuid;
create index products_color_group_id_idx on products(color_group_id);
