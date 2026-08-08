"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "") || null;
  if (!name) return;

  const supabase = createServiceClient();
  const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });

  await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    sort_order: count ?? 0,
    parent_id: parentId,
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

export async function moveCategory(id: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: current } = await supabase.from("categories").select("id, parent_id, sort_order").eq("id", id).single();
  if (!current) return;

  let siblingsQuery = supabase.from("categories").select("id, sort_order").order("sort_order", { ascending: true });
  siblingsQuery =
    current.parent_id === null ? siblingsQuery.is("parent_id", null) : siblingsQuery.eq("parent_id", current.parent_id);
  const { data: siblings } = await siblingsQuery;
  if (!siblings) return;

  const index = siblings.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];
  await Promise.all([
    supabase.from("categories").update({ sort_order: other.sort_order }).eq("id", id),
    supabase.from("categories").update({ sort_order: current.sort_order }).eq("id", other.id),
  ]);

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
