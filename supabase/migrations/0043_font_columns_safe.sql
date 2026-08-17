-- Idempotent safety net for the three font columns — guarantees they exist
-- regardless of whether 0015_fonts.sql / 0035_accent_font.sql actually ran
-- on this database. Safe to run even if they're already there.
alter table site_settings add column if not exists heading_font text not null default 'Playfair Display';
alter table site_settings add column if not exists body_font text not null default 'Inter';
alter table site_settings add column if not exists accent_font text not null default 'Inter';

notify pgrst, 'reload schema';
