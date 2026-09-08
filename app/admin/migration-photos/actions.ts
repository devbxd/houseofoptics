"use server";

// TEMPORARY — one-off tool to move product/brand photos still hosted on
// the old Supabase Storage project over to R2. Runs server-side (Netlify)
// specifically because migrating from a local machine hit a network-level
// TLS issue reaching R2's S3 API endpoint that doesn't happen from here —
// the exact same uploadToR2() the rest of the admin already uses daily
// works fine in this environment. Remove this whole folder once the old
// Supabase project's photos are fully migrated.

import { createServiceClient } from "@/lib/supabase/server";
import { uploadToR2 } from "@/lib/r2";

const BATCH_SIZE = 12;

// [table, column, kind] — kind is "text" for a plain url column, "array"
// for a native Postgres text[] column, or "jsonb" for a jsonb column
// storing an array.
const TARGETS: [string, string, "text" | "array" | "jsonb"][] = [
  ["brands", "homepage_banner_url", "text"],
  ["brands", "logo_url", "text"],
  ["categories", "image_url", "text"],
  ["content_page_blocks", "image_urls", "jsonb"],
  ["hero_slides", "image_url", "text"],
  ["model_photos", "image_url", "text"],
  ["order_items", "image_url", "text"],
  ["popups", "image_url", "text"],
  ["product_images", "url", "text"],
  ["product_variants", "image_urls", "array"],
  ["product_variants", "image_url", "text"],
  ["products", "tryon_image_url", "text"],
  ["products", "packaging_image_url", "text"],
  ["site_settings", "packaging_image_url", "text"],
  ["site_settings", "logo_url", "text"],
  ["testimonials", "photo_url", "text"],
  ["wishlist_items", "image", "text"],
];

function extFromUrl(url: string) {
  const m = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  return m ? m[1].toLowerCase() : "jpg";
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

const cache = new Map<string, string>();

async function migrateOneUrl(url: string): Promise<{ url: string; ok: boolean }> {
  if (!url || !url.includes("supabase.co/storage")) return { url, ok: true };
  if (cache.has(url)) return { url: cache.get(url)!, ok: true };

  try {
    const res = await fetch(url);
    if (!res.ok) return { url, ok: false };
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = extFromUrl(url);
    const contentType = CONTENT_TYPE_BY_EXT[ext] || "image/jpeg";
    const path = `migrated/${crypto.randomUUID()}.${ext}`;
    const newUrl = await uploadToR2(path, buffer, contentType);
    cache.set(url, newUrl);
    return { url: newUrl, ok: true };
  } catch {
    return { url, ok: false };
  }
}

export type MigrationBatchResult = {
  table: string;
  column: string;
  processed: number;
  migrated: number;
  failed: number;
  remainingInColumn: number;
  moreOverall: boolean;
  updateErrors: string[];
  totalCandidatesSeen: number;
};

// Processes up to BATCH_SIZE rows from the first target column that still
// has old-Supabase URLs, then reports whether anything's left anywhere —
// the client calls this repeatedly until moreOverall is false. Small
// batches keep each call well inside a serverless function's time limit.
export async function migratePhotosBatch(): Promise<MigrationBatchResult | null> {
  const supabase = createServiceClient();

  for (let ti = 0; ti < TARGETS.length; ti++) {
    const [table, column, kind] = TARGETS[ti];
    const { data: rows } = await supabase
      .from(table)
      .select(`id, ${column}`)
      .not(column, "is", null)
      .limit(500);

    const candidates = (rows ?? []).filter((r: any) => {
      const v = r[column];
      if (kind === "text") return typeof v === "string" && v.includes("supabase.co/storage");
      if (Array.isArray(v)) return v.some((u: any) => typeof u === "string" && u.includes("supabase.co/storage"));
      return false;
    });

    if (candidates.length === 0) continue;

    const batch = candidates.slice(0, BATCH_SIZE);
    let migrated = 0;
    let failed = 0;
    const updateErrors: string[] = [];

    for (const row of batch as any[]) {
      if (kind === "text") {
        const { url: newUrl, ok } = await migrateOneUrl(row[column]);
        if (ok) migrated++;
        else failed++;
        const { error, data } = await supabase.from(table).update({ [column]: newUrl }).eq("id", row.id).select("id");
        if (error) updateErrors.push(`${table}.${column} id=${row.id}: ${error.message}`);
        else if (!data || data.length === 0) updateErrors.push(`${table}.${column} id=${row.id}: update matched 0 rows`);
      } else {
        const results = await Promise.all((row[column] as string[]).map((u) => migrateOneUrl(u)));
        const newArr = results.map((r) => r.url);
        if (results.every((r) => r.ok)) migrated++;
        else failed++;
        const { error, data } = await supabase.from(table).update({ [column]: newArr }).eq("id", row.id).select("id");
        if (error) updateErrors.push(`${table}.${column} id=${row.id}: ${error.message}`);
        else if (!data || data.length === 0) updateErrors.push(`${table}.${column} id=${row.id}: update matched 0 rows`);
      }
    }

    // Rough remaining count in this column after this batch, plus whether
    // any later column in TARGETS still has candidates (or this one does).
    const remainingInColumn = Math.max(0, candidates.length - batch.length);
    const moreOverall = remainingInColumn > 0 || ti < TARGETS.length - 1;

    return {
      table,
      column,
      processed: batch.length,
      migrated,
      failed,
      remainingInColumn,
      moreOverall,
      updateErrors,
      totalCandidatesSeen: candidates.length,
    };
  }

  return null; // nothing left anywhere
}
