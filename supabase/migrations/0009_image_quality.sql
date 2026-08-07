alter table products add column image_bytes integer;
create index products_image_bytes_idx on products(image_bytes);
