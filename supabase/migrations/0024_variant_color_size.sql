-- Replaces the old separate "color options" / "size options" lists with a
-- single list of variants that can each carry a color AND a size together
-- (e.g. "Black, 52mm" as one entry) — each variant is basically its own
-- near-identical version of the product.
alter table product_variants add column color_label text;
alter table product_variants add column size_label text;

-- Preserve existing data: an old color-kind row becomes a variant with only
-- a color set, an old size-kind row becomes a variant with only a size set.
update product_variants set color_label = label where kind = 'color';
update product_variants set size_label = label where kind = 'size';
