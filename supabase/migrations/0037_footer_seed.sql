-- Pre-fills the footer with a real starting structure (matching the
-- reference sites the client sent) instead of an empty "add your own
-- sections" state. Everything here is editable/removable from
-- Admin > End of page — pages that don't exist yet point to /coming-soon.
insert into footer_sections (id, title, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Customer Area', 0),
  ('11111111-1111-1111-1111-111111111102', 'Our Products', 1),
  ('11111111-1111-1111-1111-111111111103', 'Legal', 2);

insert into footer_links (section_id, label, url, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Shop', '/produits', 0),
  ('11111111-1111-1111-1111-111111111101', 'Contact Us', '/contact', 1),
  ('11111111-1111-1111-1111-111111111101', 'Our Location', '/emplacement', 2),
  ('11111111-1111-1111-1111-111111111101', 'Wishlist', '/wishlist', 3),
  ('11111111-1111-1111-1111-111111111101', 'Terms of Sale', '/coming-soon?title=Terms%20of%20Sale', 4),
  ('11111111-1111-1111-1111-111111111101', 'Payments and Shipping', '/coming-soon?title=Payments%20and%20Shipping', 5),
  ('11111111-1111-1111-1111-111111111101', 'Change or Return', '/coming-soon?title=Change%20or%20Return', 6),
  ('11111111-1111-1111-1111-111111111101', 'Warranty', '/coming-soon?title=Warranty', 7),
  ('11111111-1111-1111-1111-111111111101', 'Frequently Asked Questions', '/coming-soon?title=Frequently%20Asked%20Questions', 8),
  ('11111111-1111-1111-1111-111111111102', 'All Products', '/produits', 0),
  ('11111111-1111-1111-1111-111111111102', 'Sunglasses', '/categorie/sunglasses', 1),
  ('11111111-1111-1111-1111-111111111102', 'Summer Collection', '/categorie/summer-collection', 2),
  ('11111111-1111-1111-1111-111111111103', 'Legal Notice', '/coming-soon?title=Legal%20Notice', 0),
  ('11111111-1111-1111-1111-111111111103', 'Terms and Conditions', '/coming-soon?title=Terms%20and%20Conditions', 1),
  ('11111111-1111-1111-1111-111111111103', 'Privacy Policy', '/coming-soon?title=Privacy%20Policy', 2);
