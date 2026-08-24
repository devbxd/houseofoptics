"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

// A product's try-on cutout is generated once, client-side, by whoever
// clicks "Visualize me" first — this checks whether that's already done.
export async function getTryOnImage(productId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("products").select("tryon_image_url").eq("id", productId).maybeSingle();
  return data?.tryon_image_url ?? null;
}

// Caches the background-removed cutout the browser just produced, so every
// visitor after the first gets it instantly instead of recomputing it.
export async function saveTryOnImage(productId: string, formData: FormData): Promise<string> {
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("No image provided.");

  const supabase = createServiceClient();
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).single();
  if (!product) throw new Error("Product not found.");

  const { buffer, contentType, ext } = await processImage(file);
  const path = `${product.slug}/tryon-${crypto.randomUUID()}.${ext}`;
  const url = await uploadToR2(path, buffer, contentType);

  await supabase.from("products").update({ tryon_image_url: url }).eq("id", productId);
  return url;
}
