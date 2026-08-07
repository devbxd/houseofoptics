// Imports scripts/scraped/manifest.json directly into Supabase: uploads every
// downloaded image to the "products" storage bucket and creates one product
// per Instagram post (all under a single "Collection Instagram" category,
// no price — the client fills prices in from the dashboard).
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Usage: node scripts/seed-from-manifest.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OUT_DIR = path.join(process.cwd(), "scripts", "scraped");
const BUCKET = "products";
const DEFAULT_CATEGORY_NAME = "Collection Instagram";

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function nameFromCaption(caption, code) {
  if (!caption) return `Article ${code}`;
  const firstLine = caption.split(/\r?\n/)[0];
  const cleaned = firstLine.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
  return (cleaned || `Article ${code}`).slice(0, 120);
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw error;
    console.log(`Created public storage bucket "${BUCKET}".`);
  }
}

async function ensureDefaultCategory() {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slugify(DEFAULT_CATEGORY_NAME))
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: DEFAULT_CATEGORY_NAME, slug: slugify(DEFAULT_CATEGORY_NAME), sort_order: 0 })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const manifestRaw = await fs.readFile(path.join(OUT_DIR, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw);

  await ensureBucket();
  const categoryId = await ensureDefaultCategory();

  let created = 0;
  let skipped = 0;

  for (const post of manifest.posts) {
    if (!post.images || post.images.length === 0) {
      skipped += 1;
      continue;
    }

    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("source", "instagram_import")
      .eq("source_ref", post.code)
      .maybeSingle();
    if (existingProduct) {
      skipped += 1;
      continue;
    }

    const name = nameFromCaption(post.caption, post.code);
    const slug = `${slugify(name)}-${post.code.toLowerCase()}`.slice(0, 90);

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        category_id: categoryId,
        description: post.caption || "",
        price: null,
        source: "instagram_import",
        source_ref: post.code,
      })
      .select("id")
      .single();

    if (productError) {
      console.log(`  failed to create product for ${post.code}: ${productError.message}`);
      continue;
    }

    let sortOrder = 0;
    for (const img of post.images) {
      const filePath = path.join(OUT_DIR, img.file);
      const buffer = await fs.readFile(filePath);
      const storagePath = `${slug}/${path.basename(img.file, ".jpg")}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true });
      if (uploadError) {
        console.log(`  failed to upload ${storagePath}: ${uploadError.message}`);
        continue;
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      await supabase.from("product_images").insert({
        product_id: product.id,
        url: pub.publicUrl,
        sort_order: sortOrder++,
      });
    }

    created += 1;
    console.log(`Created product "${name}" (${post.code}) with ${post.images.length} image(s).`);
  }

  console.log(`\nDone. ${created} products created, ${skipped} skipped (already imported or no image).`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
