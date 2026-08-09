"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function toggleHeroImage(imageId: string, isHero: boolean) {
  const supabase = createServiceClient();

  if (isHero) {
    const { count } = await supabase
      .from("product_images")
      .select("*", { count: "exact", head: true })
      .eq("is_hero", true);
    await supabase.from("product_images").update({ is_hero: true, hero_order: count ?? 0 }).eq("id", imageId);
  } else {
    await supabase.from("product_images").update({ is_hero: false, hero_order: null }).eq("id", imageId);
  }

  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}

export async function uploadHeroSlide(formData: FormData) {
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) return;

  const supabase = createServiceClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `hero/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("products").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return;

  const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
  const { count } = await supabase.from("hero_slides").select("*", { count: "exact", head: true });
  await supabase.from("hero_slides").insert({ image_url: pub.publicUrl, sort_order: count ?? 0 });

  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}

export async function deleteHeroSlide(id: string) {
  const supabase = createServiceClient();
  await supabase.from("hero_slides").delete().eq("id", id);
  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}
