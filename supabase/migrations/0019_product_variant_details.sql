alter table product_variants add column kind text not null default 'color';
alter table product_variants add constraint product_variants_kind_check check (kind in ('color', 'size'));
alter table product_variants add column image_url text;
alter table product_variants add column price numeric;
alter table product_variants add column description text;
