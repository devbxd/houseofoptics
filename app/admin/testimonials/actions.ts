"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processImage, IMMUTABLE_CACHE_CONTROL } from "@/lib/process-image";

async function uploadPhoto(supabase: ReturnType<typeof createServiceClient>, file: File) {
  const { buffer, contentType, ext } = await processImage(file);
  const path = `testimonials/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  if (error) return null;
  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  return pub.publicUrl;
}

export async function createTestimonial(formData: FormData) {
  const authorName = String(formData.get("author_name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim() || null;
  const photo = formData.get("photo") as File | null;
  if (!authorName || !quote) return;

  const supabase = createServiceClient();
  const photoUrl = photo && photo.size > 0 ? await uploadPhoto(supabase, photo) : null;

  // sort_order defaults to 0 in the schema and nothing ever set it
  // explicitly — every testimonial tied at 0, so display order (here and
  // in the homepage carousel) rode entirely on Postgres's undefined
  // tie-break and could shuffle unpredictably. Newest-last by default.
  const { data: maxRow } = await supabase
    .from("testimonials")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("testimonials").insert({
    author_name: authorName,
    quote,
    rating: ratingRaw ? Number(ratingRaw) : null,
    product_id: productId,
    photo_url: photoUrl,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
  revalidateTag("testimonials");
}

export async function deleteTestimonial(id: string) {
  const supabase = createServiceClient();
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
  revalidateTag("testimonials");
}

export async function toggleTestimonial(id: string, isActive: boolean) {
  const supabase = createServiceClient();
  await supabase.from("testimonials").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
  revalidateTag("testimonials");
}
