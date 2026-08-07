"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateSettings(formData: FormData) {
  const supabase = createServiceClient();
  await supabase
    .from("site_settings")
    .update({
      brand_name: String(formData.get("brand_name") ?? "").trim() || "House of Optics",
      whatsapp_number: String(formData.get("whatsapp_number") ?? "").trim(),
      contact_email: String(formData.get("contact_email") ?? "").trim(),
      instagram_handle: String(formData.get("instagram_handle") ?? "").trim(),
      facebook_url: String(formData.get("facebook_url") ?? "").trim(),
    })
    .eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/reglages");
}
