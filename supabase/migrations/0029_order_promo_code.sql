alter table orders add column promo_code text;
alter table orders add column discount_amount numeric(10, 2) not null default 0;
