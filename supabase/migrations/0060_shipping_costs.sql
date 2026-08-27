alter table site_settings add column shipping_cost_beirut numeric(10,2) not null default 4;
alter table site_settings add column shipping_cost_outside numeric(10,2) not null default 6;
