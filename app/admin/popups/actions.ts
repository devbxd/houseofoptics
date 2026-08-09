"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function createPopup(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const description = String(formData.get("description") ?? "").trim();
  const discountRaw = String(formData.get("discount_percent") ?? "").trim();
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const durationRaw = String(formData.get("duration_days") ?? "").trim();

  const supabase = createServiceClient();
  await supabase.from("popups").insert({
    title,
    description,
    discount_percent: discountRaw ? Number(discountRaw) : null,
    max_uses: maxUsesRaw ? Number(maxUsesRaw) : null,
    duration_days: durationRaw ? Number(durationRaw) : null,
    is_active: true,
  });

  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

export async function togglePopup(id: string, isActive: boolean) {
  const supabase = createServiceClient();
  await supabase.from("popups").update({ is_active: isActive }).eq("id", id);
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}

export async function deletePopup(id: string) {
  const supabase = createServiceClient();
  await supabase.from("popups").delete().eq("id", id);
  revalidatePath("/admin/popups");
  revalidatePath("/", "layout");
}
