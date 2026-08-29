-- A manual "Sold out" override, independent of the real stock numbers —
-- flipping it on shows the product as out of stock everywhere on the site
-- without touching stock/variant stock, so flipping it back off needs no
-- re-entry of anything.
alter table products add column is_sold_out boolean not null default false;
