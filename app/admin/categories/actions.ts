"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = createServiceClient();
  const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });

  await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    sort_order: count ?? 0,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function renameCategory(id: string, name: string) {
  if (!name.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("categories").update({ name: name.trim(), slug: slugify(name) }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
