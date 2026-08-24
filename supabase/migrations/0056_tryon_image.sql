-- "Visualize me" live try-on: a cached, background-removed cutout of the
-- product's main photo, generated once (client-side, first time anyone
-- tries it on that product) and reused by every visitor after that instead
-- of recomputing background removal on every visit.
alter table products add column tryon_image_url text;
