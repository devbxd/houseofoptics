-- So the invoice/order notification/admin dashboard can say exactly what
-- happened ("Gift card K7XQ-...: Ray-Ban Aviator — FREE" or "-$30 credit")
-- instead of just showing an already-discounted total with no explanation.
-- gift_card_code itself (added in 0046) only identifies which code was
-- used — these three add what it actually did, snapshotted at order time
-- so the invoice stays accurate even if the gift card row is edited or
-- deleted later.
alter table orders add column if not exists gift_card_type text;
alter table orders add column if not exists gift_card_amount numeric(10,2);
alter table orders add column if not exists gift_card_product_name text;
