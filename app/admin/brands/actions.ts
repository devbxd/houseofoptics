"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { processImage, IMMUTABLE_CACHE_CONTROL } from "@/lib/process-image";

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
  const { error } = await supabase.storage.from("products").upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  // Used to just `return` here on failure — BrandRow's upload handler had
  // no catch to surface anything to, so a failed logo upload reverted
  // silently to the placeholder with zero explanation of what happened.
  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  await supabase.from("brands").update({ logo_url: pub.publicUrl }).eq("id", id);

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
  const { error } = await supabase.storage.from("products").upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  if (error) return;

  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  await supabase.from("brands").update({ homepage_banner_url: pub.publicUrl }).eq("id", id);

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
