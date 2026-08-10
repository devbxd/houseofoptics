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

// The client types each line in whichever language is easiest for them —
// this auto-translates it into all three site locales so every visitor
// sees it correctly regardless of the site's active language. Any of the
// three lines left empty reverts to the site's built-in default text.
async function translateOrClear(text: string) {
  if (!text) return { fr: null, en: null, ar: null };
  return translateToAllLocales(text);
}

export async function updateHeroTexts(formData: FormData) {
  const eyebrow = String(formData.get("hero_eyebrow") ?? "").trim();
  const title = String(formData.get("hero_title") ?? "").trim();
  const subtitle = String(formData.get("hero_subtitle") ?? "").trim();

  const [eyebrowTr, titleTr, subtitleTr] = await Promise.all([
    translateOrClear(eyebrow),
    translateOrClear(title),
    translateOrClear(subtitle),
  ]);

  const fields = {
    hero_eyebrow_fr: eyebrowTr.fr,
    hero_eyebrow_en: eyebrowTr.en,
    hero_eyebrow_ar: eyebrowTr.ar,
    hero_title_fr: titleTr.fr,
    hero_title_en: titleTr.en,
    hero_title_ar: titleTr.ar,
    hero_subtitle_fr: subtitleTr.fr,
    hero_subtitle_en: subtitleTr.en,
    hero_subtitle_ar: subtitleTr.ar,
  };

  const supabase = createServiceClient();
  // hero_eyebrow_*/hero_subtitle_* come from a migration that may not have
  // run yet — retry without them so the title (older column) still saves.
  const { error } = await supabase.from("site_settings").update(fields).eq("id", true);
  if (error) {
    const { hero_eyebrow_fr, hero_eyebrow_en, hero_eyebrow_ar, hero_subtitle_fr, hero_subtitle_en, hero_subtitle_ar, ...fallback } =
      fields;
    const { error: fallbackError } = await supabase.from("site_settings").update(fallback).eq("id", true);
    if (fallbackError) {
      throw new Error("Couldn't save the hero text — the database may need the latest migration applied.");
    }
  }

  revalidatePath("/admin/hero");
  revalidatePath("/", "layout");
}
