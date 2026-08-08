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
