"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

export async function createBrand(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = createServiceClient();
  const { count } = await supabase.from("brands").select("*", { count: "exact", head: true });

  await supabase.from("brands").insert({ name, slug: slugify(name), sort_order: count ?? 0 });

  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function renameBrand(id: string, name: string) {
  if (!name.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("brands").update({ name: name.trim(), slug: slugify(name) }).eq("id", id);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function deleteBrand(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function uploadBrandLogo(id: string, formData: FormData) {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return;

  const supabase = createServiceClient();
  const { buffer, contentType, ext } = await processImage(file);
  const path = `brands/${id}-${crypto.randomUUID()}.${ext}`;
  // Used to just `return` here on failure — BrandRow's upload handler had
  // no catch to surface anything to, so a failed logo upload reverted
  // silently to the placeholder with zero explanation of what happened.
  const url = await uploadToR2(path, buffer, contentType);
  await supabase.from("brands").update({ logo_url: url }).eq("id", id);

  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function removeBrandLogo(id: string) {
  const supabase = createServiceClient();
  await supabase.from("brands").update({ logo_url: null }).eq("id", id);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

// The homepage showcase banner is its own photo, deliberately separate
// from a product photo — the client picks one framed for a wide banner
// instead of it being auto-cropped from whatever a product happens to have.
export async function uploadBrandBanner(id: string, formData: FormData) {
  const file = formData.get("banner") as File | null;
  if (!file || file.size === 0) return;

  const supabase = createServiceClient();
  const { buffer, contentType, ext } = await processImage(file);
  const path = `brands/banners/${id}-${crypto.randomUUID()}.${ext}`;
  let url: string;
  try {
    url = await uploadToR2(path, buffer, contentType);
  } catch {
    return;
  }

  await supabase.from("brands").update({ homepage_banner_url: url }).eq("id", id);

  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function removeBrandBanner(id: string) {
  const supabase = createServiceClient();
  await supabase.from("brands").update({ homepage_banner_url: null }).eq("id", id);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function setBrandFeatured(id: string, featured: boolean) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("brands").update({ featured_on_homepage: featured }).eq("id", id);
  if (error) throw new Error("Couldn't save — the database may need the latest migration applied.");
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
  revalidateTag("products");
}
