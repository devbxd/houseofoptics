// Real (non-generative) image enhancement pass over every product photo in
// Supabase Storage: mild sharpening + contrast/saturation lift + clean
// Lanczos resize. This makes soft/slightly-compressed JPEGs look crisper —
// it does NOT invent detail that isn't in the source, so genuinely tiny
// source images (see the report at the end) won't turn into something they
// aren't. Overwrites the same storage path, so no DB changes needed.
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Usage: node scripts/enhance-images.mjs

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "products";
const TARGET_LONG_SIDE = 1600;
const SMALL_THRESHOLD = 500; // short side below this = genuinely needs a real replacement photo
const CONCURRENCY = 8;

function storagePathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

async function enhanceOne(img) {
  const path = storagePathFromUrl(img.url);
  if (!path) return { ...img, skipped: true };

  try {
    const res = await fetch(img.url);
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    const shortSide = Math.min(meta.width ?? 0, meta.height ?? 0);

    const enhanced = await sharp(buf)
      .resize({
        width: TARGET_LONG_SIDE,
        height: TARGET_LONG_SIDE,
        fit: "inside",
        withoutEnlargement: shortSide >= TARGET_LONG_SIDE, // don't upscale already-large images
        kernel: sharp.kernel.lanczos3,
      })
      .sharpen({ sigma: 1.1 })
      .modulate({ saturation: 1.08, brightness: 1.02 })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const { error } = await supabase.storage.from(BUCKET).upload(path, enhanced, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;

    return { ...img, shortSide, tooSmall: shortSide < SMALL_THRESHOLD };
  } catch (err) {
    return { ...img, error: err.message };
  }
}

async function main() {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, images:product_images(url, sort_order)")
    .order("created_at", { ascending: false });

  const jobs = [];
  for (const p of products ?? []) {
    for (const img of p.images ?? []) {
      jobs.push({ productId: p.id, productName: p.name, url: img.url });
    }
  }

  console.log(`Enhancing ${jobs.length} images (concurrency ${CONCURRENCY})...`);

  const results = [];
  for (let i = 0; i < jobs.length; i += CONCURRENCY) {
    const batch = jobs.slice(i, i + CONCURRENCY);
    const done = await Promise.all(batch.map(enhanceOne));
    results.push(...done);
    if ((i + CONCURRENCY) % 80 < CONCURRENCY) console.log(`${Math.min(i + CONCURRENCY, jobs.length)}/${jobs.length}`);
  }

  const tooSmall = results.filter((r) => r.tooSmall);
  const failed = results.filter((r) => r.error);

  console.log(`\nDone. ${results.length - failed.length} enhanced, ${failed.length} failed.`);
  console.log(`\n${tooSmall.length} images are genuinely low-resolution (under ${SMALL_THRESHOLD}px) — sharpening can't fix these, the client needs to supply a better photo:`);
  const byProduct = new Map();
  for (const r of tooSmall) byProduct.set(r.productName, (byProduct.get(r.productName) ?? 0) + 1);
  for (const [name] of byProduct) console.log(` - ${name}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
