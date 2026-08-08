alter table testimonials add column product_id uuid references products(id) on delete set null;
create index testimonials_product_id_idx on testimonials(product_id);
