"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT, DEFAULT_ACCENT_FONT } from "@/lib/fonts";

export async function updateFonts(formData: FormData) {
  const headingFontRaw = String(formData.get("heading_font") ?? "");
  const bodyFontRaw = String(formData.get("body_font") ?? "");
  const accentFontRaw = String(formData.get("accent_font") ?? "");
  const headingFont = headingFontRaw in HEADING_FONTS ? headingFontRaw : DEFAULT_HEADING_FONT;
  const bodyFont = bodyFontRaw in BODY_FONTS ? bodyFontRaw : DEFAULT_BODY_FONT;
  const accentFont = accentFontRaw in BODY_FONTS ? accentFontRaw : DEFAULT_ACCENT_FONT;

  const supabase = createServiceClient();
  const fields = { heading_font: headingFont, body_font: bodyFont, accent_font: accentFont };
  // accent_font comes from a migration that may not have run yet — retry
  // without it so heading/body font (older columns) still save.
  const { error } = await supabase.from("site_settings").update(fields).eq("id", true);
  if (error) {
    const { accent_font, ...fallback } = fields;
    await supabase.from("site_settings").update(fallback).eq("id", true);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/police");
}
