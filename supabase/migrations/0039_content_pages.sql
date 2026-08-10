-- Real, dashboard-editable text pages for the footer's policy/info links
-- (Terms of Sale, Warranty, FAQ...) instead of raw URLs the client would
-- have to type — the client edits the page's title/text here, the footer
-- link itself never needs to change.
create table content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);
alter table content_pages enable row level security;
create policy "public read content_pages" on content_pages for select using (true);

insert into content_pages (slug, title, body) values
  ('terms-of-sale', 'Terms of Sale', 'Content coming soon — check back later.'),
  ('payments-and-shipping', 'Payments and Shipping', 'Content coming soon — check back later.'),
  ('change-or-return', 'Change or Return', 'Content coming soon — check back later.'),
  ('warranty', 'Warranty', 'Content coming soon — check back later.'),
  ('faq', 'Frequently Asked Questions', 'Content coming soon — check back later.'),
  ('legal-notice', 'Legal Notice', 'Content coming soon — check back later.'),
  ('terms-and-conditions', 'Terms and Conditions', 'Content coming soon — check back later.'),
  ('privacy-policy', 'Privacy Policy', 'Content coming soon — check back later.');

-- Point the seeded footer links (0037) at these real pages instead of the
-- generic /coming-soon placeholder — a no-op if 0037 hasn't run yet.
update footer_links set url = '/page/terms-of-sale' where url = '/coming-soon?title=Terms%20of%20Sale';
update footer_links set url = '/page/payments-and-shipping' where url = '/coming-soon?title=Payments%20and%20Shipping';
update footer_links set url = '/page/change-or-return' where url = '/coming-soon?title=Change%20or%20Return';
update footer_links set url = '/page/warranty' where url = '/coming-soon?title=Warranty';
update footer_links set url = '/page/faq' where url = '/coming-soon?title=Frequently%20Asked%20Questions';
update footer_links set url = '/page/legal-notice' where url = '/coming-soon?title=Legal%20Notice';
update footer_links set url = '/page/terms-and-conditions' where url = '/coming-soon?title=Terms%20and%20Conditions';
update footer_links set url = '/page/privacy-policy' where url = '/coming-soon?title=Privacy%20Policy';
