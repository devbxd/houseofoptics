-- Packaging photo moves from one site-wide setting to per-product, so each
-- product can show its own box/pouch/cleaning cloth photo instead of every
-- product sharing the same one.
alter table products add column packaging_image_url text;
