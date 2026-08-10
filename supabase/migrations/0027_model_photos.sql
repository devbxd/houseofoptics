create table model_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  product_id uuid not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index model_photos_product_id_idx on model_photos(product_id);

alter table model_photos enable row level security;
create policy "Public read model_photos" on model_photos for select using (true);
