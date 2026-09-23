-- A size row can now say which colors it actually comes in. NULL (or empty)
-- means "every color", which is how every existing row keeps behaving.
alter table product_variants add column if not exists available_colors text[];
