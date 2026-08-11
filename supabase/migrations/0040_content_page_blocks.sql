-- Turns each content page into a list of blocks (text, or a scrollable
-- photo gallery) instead of one plain text field, so the client can build
-- a page out of text + images in any order/combination they want.
create table content_page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references content_pages(id) on delete cascade,
  type text not null check (type in ('text', 'images')),
  text text,
  image_urls jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index content_page_blocks_page_id_idx on content_page_blocks(page_id);
alter table content_page_blocks enable row level security;
create policy "public read content_page_blocks" on content_page_blocks for select using (true);

-- Carry forward whatever text is already in content_pages.body (e.g. the
-- client's own "Size Guide" page) as that page's first block, so nothing
-- already typed is lost.
insert into content_page_blocks (page_id, type, text, sort_order)
select id, 'text', body, 0 from content_pages where coalesce(trim(body), '') <> '';
