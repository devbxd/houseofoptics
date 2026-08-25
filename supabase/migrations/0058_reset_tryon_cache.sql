-- Every try-on cutout cached before this point was framed inconsistently
-- (see the crop fix in components/VisualizeMeButton.tsx) — clearing the
-- cache forces each product to regenerate its cutout, with the new tighter
-- crop, the next time someone tries it on.
update products set tryon_image_url = null where tryon_image_url is not null;
