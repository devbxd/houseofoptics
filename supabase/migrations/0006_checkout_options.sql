alter table orders add column payment_method text not null default 'card'; -- 'card' | 'cod'
alter table orders add column shipping_zone text; -- 'beirut' | 'outside_beirut'
alter table orders add column shipping_cost numeric(10, 2) not null default 0;
