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
  // heading_font/body_font (older columns, always present) and accent_font
  // (newer column, migration may not have run on every environment) are
  // saved as two separate updates — previously they were bundled into one
  // update() call, so if accent_font's column was missing, the whole call
  // errored and heading/body silently failed to save too.
  await supabase.from("site_settings").update({ heading_font: headingFont, body_font: bodyFont }).eq("id", true);
  await supabase.from("site_settings").update({ accent_font: accentFont }).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/police");
}
