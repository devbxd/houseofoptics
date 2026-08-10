"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

function refresh() {
  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
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
  const { count } = await supabase.from("footer_sections").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("footer_sections").insert({ title, sort_order: count ?? 0 });
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

export async function moveFooterSection(id: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: sections } = await supabase.from("footer_sections").select("id, sort_order").order("sort_order", { ascending: true });
  if (!sections) return;
  const idx = sections.findIndex((s) => s.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= sections.length) return;

  await Promise.all([
    supabase.from("footer_sections").update({ sort_order: sections[swapWith].sort_order }).eq("id", sections[idx].id),
    supabase.from("footer_sections").update({ sort_order: sections[idx].sort_order }).eq("id", sections[swapWith].id),
  ]);
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

  const { count } = await supabase
    .from("footer_links")
    .select("*", { count: "exact", head: true })
    .eq("section_id", sectionId);
  const { error } = await supabase
    .from("footer_links")
    .insert({ section_id: sectionId, label: label.trim(), url: `/page/${slug}`, sort_order: count ?? 0 });
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

export async function moveFooterLink(id: string, sectionId: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: links } = await supabase
    .from("footer_links")
    .select("id, sort_order")
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true });
  if (!links) return;
  const idx = links.findIndex((l) => l.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapWith < 0 || swapWith >= links.length) return;

  await Promise.all([
    supabase.from("footer_links").update({ sort_order: links[swapWith].sort_order }).eq("id", links[idx].id),
    supabase.from("footer_links").update({ sort_order: links[idx].sort_order }).eq("id", links[swapWith].id),
  ]);
  refresh();
}

// The text shown on pages like /page/warranty, /page/faq... — editing the
// text here means the client never has to touch the footer link's URL.
export async function updateContentPage(id: string, title: string, body: string) {
  if (!title.trim()) return;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("content_pages")
    .update({ title: title.trim(), body: body.trim(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error("Couldn't save — the database may need the latest migration applied.");
  refresh();
}
