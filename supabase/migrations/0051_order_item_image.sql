-- The admin orders list only ever showed the item's name — no way to tell
-- at a glance which product/variant was actually ordered without opening
-- it up. Snapshotted at checkout time (like product_name already is),
-- not joined live, so it still shows correctly even if the product's
-- photos change or the product gets deleted later.
alter table order_items add column if not exists image_url text;
