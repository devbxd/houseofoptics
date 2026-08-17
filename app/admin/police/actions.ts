"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT, DEFAULT_ACCENT_FONT } from "@/lib/fonts";

export async function updateFonts(formData: FormData) {
  const headingFontRaw = String(formData.get("heading_font") ?? "");
  const bodyFontRaw = String(formData.get("body_font") ?? "");
  const accentFontRaw = String(formData.get("accent_font") ?? "");

  const headingFont = Object.keys(HEADING_FONTS).includes(headingFontRaw) ? headingFontRaw : DEFAULT_HEADING_FONT;
  const bodyFont = Object.keys(BODY_FONTS).includes(bodyFontRaw) ? bodyFontRaw : DEFAULT_BODY_FONT;
  const accentFont = Object.keys(BODY_FONTS).includes(accentFontRaw) ? accentFontRaw : DEFAULT_ACCENT_FONT;

  const supabase = createServiceClient();

  // Written and verified one column at a time — if any single field fails
  // to save (missing column, RLS, whatever), that's reported back instead
  // of silently discarded, and it can never take the other two down with
  // it the way one bundled update() used to.
  const fields: [string, string][] = [
    ["heading_font", headingFont],
    ["body_font", bodyFont],
    ["accent_font", accentFont],
  ];

  const failures: string[] = [];

  for (const [column, value] of fields) {
    const { data, error } = await supabase
      .from("site_settings")
      .update({ [column]: value })
      .eq("id", true)
      .select(column)
      .single();

    if (error) {
      failures.push(`${column}: ${error.message}`);
      continue;
    }
    // Belt and suspenders — update() can report success while writing a
    // different value than requested (e.g. a trigger/constraint quietly
    // coercing it). Read back what's actually in the row and compare.
    if (!data || (data as unknown as Record<string, unknown>)[column] !== value) {
      failures.push(`${column}: saved value doesn't match what was submitted`);
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/police");

  if (failures.length > 0) {
    redirect(`/admin/police?error=${encodeURIComponent(failures.join("; "))}`);
  }
  redirect("/admin/police?saved=1");
}
