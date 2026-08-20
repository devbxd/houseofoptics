"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

export async function submitTestimonial(formData: FormData) {
  const authorName = String(formData.get("author_name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim() || null;
  const photo = formData.get("photo") as File | null;

  if (!authorName || !quote) return { error: "Name and review are required" };

  const supabase = createServiceClient();

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const { buffer, contentType, ext } = await processImage(photo);
    const path = `testimonials/${crypto.randomUUID()}.${ext}`;
    try {
      photoUrl = await uploadToR2(path, buffer, contentType);
    } catch {
      // photo upload failed — the review itself still goes through without one
    }
  }

  // sort_order defaults to 0 and nothing set it explicitly before — see
  // the same fix in admin/testimonials/actions.ts.
  const { data: maxRow } = await supabase
    .from("testimonials")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Customer-submitted reviews are never shown immediately — the owner has
  // to approve them from the dashboard first (same is_active flag already
  // used to hide/show any testimonial).
  const { error } = await supabase.from("testimonials").insert({
    author_name: authorName,
    quote,
    rating: ratingRaw ? Number(ratingRaw) : null,
    photo_url: photoUrl,
    product_id: productId,
    is_active: false,
    sort_order: (maxRow?.sort_order ?? -1) + 1,
  });

  if (error) return { error: error.message };
  return { error: null };
}
