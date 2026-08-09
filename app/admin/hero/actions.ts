"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { translateToAllLocales } from "@/lib/translate";

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

// The client types the headline in whichever language is easiest for
// them — this auto-translates it into all three site locales so every
// visitor sees it correctly regardless of the site's active language.
export async function updateHeroTitle(formData: FormData) {
  const text = String(formData.get("hero_title") ?? "").trim();
  const supabase = createServiceClient();

  if (!text) {
    await supabase
      .from("site_settings")
      .update({ hero_title_fr: null, hero_title_en: null, hero_title_ar: null })
      .eq("id", true);
    revalidatePath("/admin/hero");
    revalidatePath("/", "layout");
    return;
  }

  const { fr, en, ar } = await translateToAllLocales(text);
  const fields = { hero_title_fr: fr, hero_title_en: en, hero_title_ar: ar };

  // hero_title_* come from a migration that may not have run yet — retry
  // the base settings update path is unaffected either way since this is
  // its own isolated update call.
  const { error } = await supabase.from("site_settings").update(fields).eq("id", true);
  if (error) {
    // Nothing sensible to fall back to here (there are no older columns
    // for this field) — surface it so the admin knows the save didn't
    // take effect rather than silently doing nothing.
    throw new Error("Couldn't save the hero title — the database may need the latest migration applied.");
  }

  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}
