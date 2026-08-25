-- product_related_products was created in 0034 without row level security
-- or a public read policy — every other table the storefront reads has
-- one, this was simply missed. Without it, the anon client used by the
-- public site (lib/supabase/public.ts) gets nothing back when reading a
-- product's manually picked "related products", so admin picks (which
-- read fine through the service-role client) never actually appeared on
-- the live product page.
alter table product_related_products enable row level security;
create policy "public read product_related_products" on product_related_products for select using (true);
