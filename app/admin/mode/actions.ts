"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { SiteMode } from "@/lib/settings";

export async function setSiteMode(mode: SiteMode) {
  const supabase = createServiceClient();
  await supabase.from("site_settings").update({ active_mode: mode }).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/mode");
  revalidateTag("settings");
}

export async function setSpinWheelEnabled(enabled: boolean) {
  const supabase = createServiceClient();
  await supabase.from("site_settings").update({ spin_wheel_enabled: enabled }).eq("id", true);

  revalidatePath("/", "layout");
  revalidatePath("/admin/mode");
  revalidateTag("settings");
}
