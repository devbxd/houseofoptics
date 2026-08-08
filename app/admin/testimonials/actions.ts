"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

async function uploadPhoto(supabase: ReturnType<typeof createServiceClient>, file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `testimonials/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
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

  await supabase.from("testimonials").insert({
    author_name: authorName,
    quote,
    rating: ratingRaw ? Number(ratingRaw) : null,
    product_id: productId,
    photo_url: photoUrl,
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}

export async function deleteTestimonial(id: string) {
  const supabase = createServiceClient();
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}

export async function toggleTestimonial(id: string, isActive: boolean) {
  const supabase = createServiceClient();
  await supabase.from("testimonials").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/testimonials");
  revalidatePath("/", "layout");
}
