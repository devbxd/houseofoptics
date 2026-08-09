"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = createServiceClient();

  const update: Record<string, unknown> = {
    brand_name: String(formData.get("brand_name") ?? "").trim() || "House of Optics",
    whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    instagram_handle: String(formData.get("instagram_handle") ?? "").trim(),
    facebook_url: String(formData.get("facebook_url") ?? "").trim(),
    announcement_text: String(formData.get("announcement_text") ?? "").trim() || "Nouveautés ajoutées chaque semaine",
    shop_address: String(formData.get("shop_address") ?? "").trim() || "Smoke N Black, Furn El Chebbak, Liban",
    shop_description: String(formData.get("shop_description") ?? "").trim(),
    shop_description_en: String(formData.get("shop_description_en") ?? "").trim(),
    shop_description_ar: String(formData.get("shop_description_ar") ?? "").trim(),
  };

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const ext = logo.name.split(".").pop() || "png";
    const path = `site/logo-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(path, logo, {
      contentType: logo.type || "image/png",
      upsert: false,
    });
    if (!error) {
      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      update.logo_url = pub.publicUrl;
    }
  }

  await supabase.from("site_settings").update(update).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/reglages");
  revalidatePath("/emplacement");
}
