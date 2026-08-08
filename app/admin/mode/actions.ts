"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { SiteMode } from "@/lib/settings";

export async function setSiteMode(mode: SiteMode) {
  const supabase = createServiceClient();
  await supabase.from("site_settings").update({ active_mode: mode }).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/mode");
}
