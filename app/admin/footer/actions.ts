"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { processImage, IMMUTABLE_CACHE_CONTROL } from "@/lib/process-image";

function refresh() {
  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
  // Harmless no-op for the content-page functions further down this file
  // that also call refresh() — only the footer_sections/footer_links
  // functions actually populate this cache entry.
  revalidateTag("footer");
}

// Facebook/Instagram/WhatsApp/Email all come from Admin > Settings — this
// only owns the copyright line. footer_copyright_text comes from a
// migration that may not have run yet.
export async function updateFooterSocials(formData: FormData) {
  const fields = {
    footer_copyright_text: String(formData.get("footer_copyright_text") ?? "").trim(),
  };
  const supabase = createServiceClient();
  const { error } = await supabase.from("site_settings").update(fields).eq("id", true);
  if (error) {
    throw new Error("Couldn't save — the database may need the latest migration applied.");
  }
  refresh();
}

export async function createFooterSection(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const supabase = createServiceClient();
  // Counting existing rows breaks as soon as one has ever been deleted —
  // count doesn't account for the gap, so a new row can land on the same
  // sort_order as an existing one. Basing it on the current max is immune
  // to gaps.
  const { data: maxRow } = await supabase
    .from("footer_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("footer_sections").insert({ title, sort_order: (maxRow?.sort_order ?? -1) + 1 });
  if (error) throw new Error("Couldn't create the section — the database may need the latest migration applied.");
  refresh();
}

export async function renameFooterSection(id: string, title: string) {
  if (!title.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("footer_sections").update({ title: title.trim() }).eq("id", id);
  refresh();
}

export async function deleteFooterSection(id: string) {
  const supabase = createServiceClient();
  await supabase.from("footer_sections").delete().eq("id", id);
  refresh();
}

// Full-recompute reorder, same approach as setCategoryPosition/
// setProductImagePosition — swapping raw sort_order values (the old way)
// silently does nothing when two rows are tied on sort_order, which
// happened routinely since inserts used to derive sort_order from a row
// count that doesn't account for deleted rows. This is immune to that: it
// reorders by *position* in a stably-sorted list and rewrites everyone's
// sort_order as a clean 0..N-1 sequence, which also heals any existing ties.
export async function moveFooterSection(id: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: sections } = await supabase
    .from("footer_sections")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (!sections) return;
  const idx = sections.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= sections.length) return;

  const ordered = sections.map((s) => s.id);
  [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];

  await Promise.all(ordered.map((sid, i) => supabase.from("footer_sections").update({ sort_order: i }).eq("id", sid)));
  refresh();
}

// No URL to type — a new content page is created automatically from the
// label (e.g. "Size Guide" -> /page/size-guide, or /page/size-guide-x7k2
// if that slug is already taken), and the link points straight at it. The
// client only ever fills in the page's text afterward, in "Page content".
export async function addFooterLink(sectionId: string, label: string) {
  if (!label.trim()) return;
  const supabase = createServiceClient();

  const baseSlug = slugify(label) || "page";
  const { data: existing } = await supabase.from("content_pages").select("id").eq("slug", baseSlug).maybeSingle();
  const slug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : baseSlug;

  const { error: pageError } = await supabase
    .from("content_pages")
    .insert({ slug, title: label.trim(), body: "Content coming soon — check back later." });
  if (pageError) throw new Error("Couldn't create the page — the database may need the latest migration applied.");

  const { data: maxRow } = await supabase
    .from("footer_links")
    .select("sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("footer_links")
    .insert({ section_id: sectionId, label: label.trim(), url: `/page/${slug}`, sort_order: (maxRow?.sort_order ?? -1) + 1 });
  if (error) throw new Error("Couldn't add the link — the database may need the latest migration applied.");
  refresh();
}

// Renaming only changes the label shown in the footer — not the URL, and
// not the linked page's own title (edited separately in "Page content").
export async function renameFooterLink(id: string, label: string) {
  if (!label.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("footer_links").update({ label: label.trim() }).eq("id", id);
  refresh();
}

export async function deleteFooterLink(id: string) {
  const supabase = createServiceClient();
  await supabase.from("footer_links").delete().eq("id", id);
  refresh();
}

// Full-recompute reorder — see moveFooterSection above for why.
export async function moveFooterLink(id: string, sectionId: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: links } = await supabase
    .from("footer_links")
    .select("id")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (!links) return;
  const idx = links.findIndex((l) => l.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= links.length) return;

  const ordered = links.map((l) => l.id);
  [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];

  await Promise.all(ordered.map((lid, i) => supabase.from("footer_links").update({ sort_order: i }).eq("id", lid)));
  refresh();
}

// Only the title — the page's actual content is a list of blocks, edited
// with the functions below.
export async function renamePage(id: string, title: string) {
  if (!title.trim()) return;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("content_pages")
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Couldn't save — the database may need the latest migration applied.");
  refresh();
}

export async function deleteContentPage(id: string) {
  const supabase = createServiceClient();
  await supabase.from("content_pages").delete().eq("id", id);
  refresh();
}

async function nextBlockSortOrder(supabase: ReturnType<typeof createServiceClient>, pageId: string) {
  const { data: maxRow } = await supabase
    .from("content_page_blocks")
    .select("sort_order")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (maxRow?.sort_order ?? -1) + 1;
}

export async function addTextBlock(pageId: string) {
  const supabase = createServiceClient();
  const sort_order = await nextBlockSortOrder(supabase, pageId);
  const { error } = await supabase.from("content_page_blocks").insert({ page_id: pageId, type: "text", text: "", sort_order });
  if (error) throw new Error("Couldn't add the block — the database may need the latest migration applied.");
  refresh();
}

export async function addImagesBlock(pageId: string) {
  const supabase = createServiceClient();
  const sort_order = await nextBlockSortOrder(supabase, pageId);
  const { error } = await supabase
    .from("content_page_blocks")
    .insert({ page_id: pageId, type: "images", image_urls: [], sort_order });
  if (error) throw new Error("Couldn't add the block — the database may need the latest migration applied.");
  refresh();
}

export async function updateBlockText(blockId: string, text: string) {
  const supabase = createServiceClient();
  await supabase.from("content_page_blocks").update({ text }).eq("id", blockId);
  refresh();
}

export async function deleteBlock(blockId: string) {
  const supabase = createServiceClient();
  await supabase.from("content_page_blocks").delete().eq("id", blockId);
  refresh();
}

// Full-recompute reorder — see moveFooterSection above for why.
export async function moveBlock(blockId: string, pageId: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: blocks } = await supabase
    .from("content_page_blocks")
    .select("id")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (!blocks) return;
  const idx = blocks.findIndex((b) => b.id === blockId);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= blocks.length) return;

  const ordered = blocks.map((b) => b.id);
  [ordered[idx], ordered[swapWith]] = [ordered[swapWith], ordered[idx]];

  await Promise.all(ordered.map((bid, i) => supabase.from("content_page_blocks").update({ sort_order: i }).eq("id", bid)));
  refresh();
}

const BUCKET = "products";

export async function uploadBlockImage(blockId: string, formData: FormData) {
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return;

  const supabase = createServiceClient();
  const { data: block } = await supabase.from("content_page_blocks").select("image_urls").eq("id", blockId).single();
  if (!block) return;

  const { buffer, contentType, ext } = await processImage(file);
  const path = `content-pages/${blockId}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  if (error) return;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const nextUrls = [...((block.image_urls as string[]) ?? []), pub.publicUrl];
  await supabase.from("content_page_blocks").update({ image_urls: nextUrls }).eq("id", blockId);
  refresh();
}

export async function removeBlockImage(blockId: string, url: string) {
  const supabase = createServiceClient();
  const { data: block } = await supabase.from("content_page_blocks").select("image_urls").eq("id", blockId).single();
  if (!block) return;
  const nextUrls = ((block.image_urls as string[]) ?? []).filter((u) => u !== url);
  await supabase.from("content_page_blocks").update({ image_urls: nextUrls }).eq("id", blockId);
  refresh();
}
