"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateTheme(formData: FormData) {
  const accent = String(formData.get("accent_color") ?? "").trim();
  const dark = String(formData.get("dark_color") ?? "").trim();
  const banner = String(formData.get("banner_color") ?? "").trim();
  if (!accent || !dark) return;

  const supabase = createServiceClient();
  await supabase
    .from("site_settings")
    .update({ accent_color: accent, dark_color: dark, banner_color: banner || dark })
    .eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
}
