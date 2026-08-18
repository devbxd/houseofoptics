"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processImage, IMMUTABLE_CACHE_CONTROL } from "@/lib/process-image";

export async function uploadModelPhoto(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "").trim();
  const file = formData.get("image") as File | null;
  if (!productId || !file || file.size === 0) return;

  const supabase = createServiceClient();
  const { buffer, contentType, ext } = await processImage(file);
  const path = `model-photos/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, buffer, {
    contentType,
    upsert: false,
    cacheControl: IMMUTABLE_CACHE_CONTROL,
  });
  if (error) return;

  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  const { count } = await supabase.from("model_photos").select("*", { count: "exact", head: true });
  await supabase.from("model_photos").insert({ image_url: pub.publicUrl, product_id: productId, sort_order: count ?? 0 });

  revalidatePath("/admin/model-photos");
  revalidatePath("/", "layout");
}

export async function deleteModelPhoto(id: string) {
  const supabase = createServiceClient();
  await supabase.from("model_photos").delete().eq("id", id);
  revalidatePath("/admin/model-photos");
  revalidatePath("/", "layout");
}
