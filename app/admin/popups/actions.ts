"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function createPopup(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const description = String(formData.get("description") ?? "").trim();
  const discountRaw = String(formData.get("discount_percent") ?? "").trim();
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const durationRaw = String(formData.get("duration_days") ?? "").trim();
  const image = formData.get("image") as File | null;

  const supabase = createServiceClient();

  let imageUrl: string | null = null;
  if (image && image.size > 0) {
    const ext = image.name.split(".").pop() || "jpg";
    const path = `popups/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, image, {
      contentType: image.type || "image/jpeg",
      upsert: false,
    });
    if (!error) {
      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
  }

  const fields = {
    title,
    description,
    discount_percent: discountRaw ? Number(discountRaw) : null,
    max_uses: maxUsesRaw ? Number(maxUsesRaw) : null,
    duration_days: durationRaw ? Number(durationRaw) : null,
    image_url: imageUrl,
    is_active: true,
  };

  // image_url comes from a migration that may not have run yet — retry
  // without it rather than failing the whole save.
  const { error } = await supabase.from("popups").insert(fields);
  if (error) {
    const { image_url, ...fallback } = fields;
    await supabase.from("popups").insert(fallback);
  }

  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

export async function togglePopup(id: string, isActive: boolean) {
  const supabase = createServiceClient();
  await supabase.from("popups").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

export async function deletePopup(id: string) {
  const supabase = createServiceClient();
  await supabase.from("popups").delete().eq("id", id);
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}
