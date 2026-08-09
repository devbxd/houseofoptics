"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT } from "@/lib/fonts";

export async function updateTheme(formData: FormData) {
  const accent = String(formData.get("accent_color") ?? "").trim();
  const dark = String(formData.get("dark_color") ?? "").trim();
  const banner = String(formData.get("banner_color") ?? "").trim();
  if (!accent || !dark) return;

  const headingFontRaw = String(formData.get("heading_font") ?? "");
  const bodyFontRaw = String(formData.get("body_font") ?? "");
  const headingFont = headingFontRaw in HEADING_FONTS ? headingFontRaw : DEFAULT_HEADING_FONT;
  const bodyFont = bodyFontRaw in BODY_FONTS ? bodyFontRaw : DEFAULT_BODY_FONT;

  const supabase = createServiceClient();
  await supabase
    .from("site_settings")
    .update({
      accent_color: accent,
      dark_color: dark,
      banner_color: banner || dark,
      heading_font: headingFont,
      body_font: bodyFont,
    })
    .eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
}
