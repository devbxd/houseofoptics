"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { processImage } from "@/lib/process-image";
import { uploadToR2 } from "@/lib/r2";

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

  const shippingBeirut = String(formData.get("shipping_cost_beirut") ?? "").trim();
  const shippingOutside = String(formData.get("shipping_cost_outside") ?? "").trim();
  if (shippingBeirut) update.shipping_cost_beirut = Number(shippingBeirut);
  if (shippingOutside) update.shipping_cost_outside = Number(shippingOutside);

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const { buffer, contentType, ext } = await processImage(logo);
    const path = `site/logo-${crypto.randomUUID()}.${ext}`;
    try {
      update.logo_url = await uploadToR2(path, buffer, contentType);
    } catch {
      // logo upload failed — the rest of the settings still save
    }
  }

  await supabase.from("site_settings").update(update).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/reglages");
  revalidatePath("/emplacement");
  revalidateTag("settings");
}
