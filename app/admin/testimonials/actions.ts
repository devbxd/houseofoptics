"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function createTestimonial(formData: FormData) {
  const authorName = String(formData.get("author_name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const productId = String(formData.get("product_id") ?? "").trim() || null;
  if (!authorName || !quote) return;

  const supabase = createServiceClient();
  await supabase.from("testimonials").insert({
    author_name: authorName,
    quote,
    rating: ratingRaw ? Number(ratingRaw) : null,
    product_id: productId,
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
