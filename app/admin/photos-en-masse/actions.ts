"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

// One photo, one product — called once per photo from the bulk uploader so
// the page can show live per-photo progress instead of one opaque "upload
// everything" spinner. Appends to that product's existing photos, same as
// the normal per-product upload, never replaces them.
export async function uploadBulkProductPhoto(productId: string, formData: FormData) {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) throw new Error("No photo provided");
  if (!productId) throw new Error("No product selected");

  const supabase = createServiceClient();
  const { buffer, contentType, ext } = await processImage(file);
  const path = `bulk/${productId}/${crypto.randomUUID()}.${ext}`;
  const url = await uploadToR2(path, buffer, contentType);

  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error: insertError } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, sort_order: count ?? 0 });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/", "layout");
  revalidateTag("products");
}
