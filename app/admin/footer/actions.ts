"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

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

export async function addFooterLink(sectionId: string, label: string, url: string) {
  if (!label.trim() || !url.trim()) return;
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("footer_links")
    .select("*", { count: "exact", head: true })
    .eq("section_id", sectionId);
  const { error } = await supabase
    .from("footer_links")
    .insert({ section_id: sectionId, label: label.trim(), url: url.trim(), sort_order: count ?? 0 });
  if (error) throw new Error("Couldn't add the link — the database may need the latest migration applied.");
  refresh();
}

export async function updateFooterLink(id: string, label: string, url: string) {
  if (!label.trim() || !url.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("footer_links").update({ label: label.trim(), url: url.trim() }).eq("id", id);
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
