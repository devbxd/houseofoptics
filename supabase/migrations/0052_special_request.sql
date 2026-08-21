-- "Special Request" (what the admin called "pre-order") — a customer who
-- wants a specific model that isn't on the site sends a description +
-- optional photo straight to the shop's WhatsApp. The explanation text is
-- editable per locale, same pattern as shop_description/_en/_ar.
alter table site_settings add column if not exists special_request_title text;
alter table site_settings add column if not exists special_request_text text;
alter table site_settings add column if not exists special_request_text_en text;
alter table site_settings add column if not exists special_request_text_ar text;
