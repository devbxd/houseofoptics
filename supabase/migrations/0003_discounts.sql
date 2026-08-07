alter table products
  add column discount_percent integer check (discount_percent is null or (discount_percent between 0 and 95));
