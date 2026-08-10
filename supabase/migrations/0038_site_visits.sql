-- One row per real visit (first page load of a browser session), unlike
-- page_views which logs every single page navigation and inflates the
-- count anytime someone browses more than one page.
create table site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table site_visits enable row level security;
-- No public policies — only the server (service role, via /api/track-visit) writes this.
