"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function submitTestimonial(formData: FormData) {
  const authorName = String(formData.get("author_name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const photo = formData.get("photo") as File | null;

  if (!authorName || !quote) return { error: "Name and review are required" };

  const supabase = createServiceClient();

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const ext = photo.name.split(".").pop() || "jpg";
    const path = `testimonials/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("products").upload(path, photo, {
      contentType: photo.type || "image/jpeg",
      upsert: false,
    });
    if (!uploadError) {
      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      photoUrl = pub.publicUrl;
    }
  }

  // Customer-submitted reviews are never shown immediately — the owner has
  // to approve them from the dashboard first (same is_active flag already
  // used to hide/show any testimonial).
  const { error } = await supabase.from("testimonials").insert({
    author_name: authorName,
    quote,
    rating: ratingRaw ? Number(ratingRaw) : null,
    photo_url: photoUrl,
    is_active: false,
  });

  if (error) return { error: error.message };
  return { error: null };
}
