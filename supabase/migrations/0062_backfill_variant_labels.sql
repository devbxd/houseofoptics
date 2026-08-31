-- The admin's variant save always failed its primary insert (label is
-- NOT NULL and wasn't being set) and silently fell back to writing only
-- the older label/kind columns, leaving color_label/size_label null on
-- every variant added or edited since that redesign shipped. Most reads
-- already fall back to label/kind when color_label is null, but a few
-- (like search) read color_label directly — this backfills the real
-- columns from the legacy ones so every row is consistent everywhere,
-- and the app code (fixed alongside this migration) now writes both
-- column pairs on every save going forward.
update product_variants
set color_label = label
where color_label is null and kind = 'color' and label is not null and label <> '';

update product_variants
set size_label = label
where size_label is null and kind = 'size' and label is not null and label <> '';
