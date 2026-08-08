"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function createBrand(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = createServiceClient();
  const { count } = await supabase.from("brands").select("*", { count: "exact", head: true });

  await supabase.from("brands").insert({ name, slug: slugify(name), sort_order: count ?? 0 });

  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
}

export async function renameBrand(id: string, name: string) {
  if (!name.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("brands").update({ name: name.trim(), slug: slugify(name) }).eq("id", id);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
}

export async function deleteBrand(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/brands");
  revalidatePath("/", "layout");
}
