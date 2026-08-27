-- A color can now have a full photo gallery (like the product itself),
-- not just one image — image_url stays as a fallback/legacy single photo
-- for old rows and non-color variants, image_urls is the real gallery used
-- by new color rows going forward.
alter table product_variants add column image_urls text[];
