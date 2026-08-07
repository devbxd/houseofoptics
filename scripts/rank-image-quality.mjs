// One-time (re-runnable) script: measures each product's cover image file
// size (a reliable proxy for resolution since all images come from the same
// Instagram source) and stores it in products.image_bytes, so the catalog
// can be sorted best-quality-first.
//
// Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Usage: node scripts/rank-image-quality.mjs

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

const CONCURRENCY = 15;

async function measure(product) {
  try {
    const res = await fetch(product.url, { method: "HEAD" });
    const bytes = Number(res.headers.get("content-length") ?? 0);
    await supabase.from("products").update({ image_bytes: bytes }).eq("id", product.id);
    return bytes;
  } catch {
    return 0;
  }
}

async function main() {
  const { data: products } = await supabase
    .from("products")
    .select("id, images:product_images(url, sort_order)")
    .order("created_at", { ascending: false });

  const list = (products ?? [])
    .map((p) => {
      const images = (p.images ?? []).sort((a, b) => a.sort_order - b.sort_order);
      return images[0] ? { id: p.id, url: images[0].url } : null;
    })
    .filter(Boolean);

  console.log(`Measuring ${list.length} products (concurrency ${CONCURRENCY})...`);

  let done = 0;
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(measure));
    done += batch.length;
    if (done % 150 === 0 || done === list.length) console.log(`${done}/${list.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
