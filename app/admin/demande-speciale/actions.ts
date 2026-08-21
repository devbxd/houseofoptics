"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateSpecialRequestSettings(formData: FormData) {
  const supabase = createServiceClient();

  const update = {
    special_request_title: String(formData.get("special_request_title") ?? "").trim(),
    special_request_text: String(formData.get("special_request_text") ?? "").trim(),
    special_request_text_en: String(formData.get("special_request_text_en") ?? "").trim(),
    special_request_text_ar: String(formData.get("special_request_text_ar") ?? "").trim(),
  };

  await supabase.from("site_settings").update(update).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/demande-speciale");
  revalidatePath("/demande-speciale");
  revalidateTag("settings");
}
