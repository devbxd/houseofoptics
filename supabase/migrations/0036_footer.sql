alter table site_settings add column youtube_url text;
alter table site_settings add column tiktok_url text;
alter table site_settings add column pinterest_url text;
alter table site_settings add column footer_copyright_text text;

-- Fully client-editable footer: any number of sections, each with any
-- number of links (e.g. "Customer Area" -> Shop, Login, Terms of sale...).
create table footer_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table footer_sections enable row level security;
create policy "public read footer_sections" on footer_sections for select using (true);

create table footer_links (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references footer_sections(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index footer_links_section_id_idx on footer_links(section_id);
alter table footer_links enable row level security;
create policy "public read footer_links" on footer_links for select using (true);
