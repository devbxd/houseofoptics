"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

export async function uploadModelPhoto(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "").trim();
  const file = formData.get("image") as File | null;
  if (!productId || !file || file.size === 0) return;

  const supabase = createServiceClient();
  const { buffer, contentType, ext } = await processImage(file);
  const path = `model-photos/${crypto.randomUUID()}.${ext}`;
  let url: string;
  try {
    url = await uploadToR2(path, buffer, contentType);
  } catch {
    return;
  }

  const { count } = await supabase.from("model_photos").select("*", { count: "exact", head: true });
  await supabase.from("model_photos").insert({ image_url: url, product_id: productId, sort_order: count ?? 0 });

  revalidatePath("/admin/model-photos");
  revalidatePath("/", "layout");
  revalidateTag("products");
}

export async function deleteModelPhoto(id: string) {
  const supabase = createServiceClient();
  await supabase.from("model_photos").delete().eq("id", id);
  revalidatePath("/admin/model-photos");
  revalidatePath("/", "layout");
  revalidateTag("products");
}
