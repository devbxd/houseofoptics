"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "") || null;
  if (!name) return;

  const supabase = createServiceClient();
  // Counting existing rows for the new sort_order breaks the ↑/↓ position
  // control the moment a category has ever been deleted: two rows can end
  // up sharing a sort_order (count doesn't account for the gap a deletion
  // leaves), and setCategoryPosition's swap-based... no — its full-recompute
  // reorder still silently produces no visible change when two siblings are
  // tied, so ↑/↓ can look like it's doing nothing. Basing the new row on the
  // current max instead is immune to gaps. Scoped to siblings (same
  // parent_id) since that's what the position control itself reorders.
  let maxQuery = supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  maxQuery = parentId === null ? maxQuery.is("parent_id", null) : maxQuery.eq("parent_id", parentId);
  const { data: maxRow } = await maxQuery.maybeSingle();

  await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    sort_order: (maxRow?.sort_order ?? -1) + 1,
    parent_id: parentId,
  });

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidateTag("categories");
  revalidateTag("products");
}

export async function renameCategory(id: string, name: string) {
  if (!name.trim()) return;
  const supabase = createServiceClient();
  await supabase.from("categories").update({ name: name.trim(), slug: slugify(name) }).eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidateTag("categories");
  revalidateTag("products");
}

// Only one category can be the "New Product" auto-expiring bucket — pass
// null to turn the feature off, or a category id to make that one the
// bucket (clearing the flag from whichever category held it before).
export async function setNewProductCategory(id: string | null) {
  const supabase = createServiceClient();
  await supabase.from("categories").update({ is_new_product_category: false }).eq("is_new_product_category", true);
  if (id) {
    const { error } = await supabase.from("categories").update({ is_new_product_category: true }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidateTag("categories");
  revalidateTag("products");
}

export async function deleteCategory(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidateTag("categories");
  revalidateTag("products");
}

// Recomputes sort_order for every sibling from scratch instead of swapping
// two values — a swap can misbehave when categories share a sort_order
// (e.g. several created in the same batch), which is what made the old
// up/down arrows unreliable. A full recompute is deterministic no matter
// what the starting values look like.
export async function setCategoryPosition(id: string, newIndex: number) {
  const supabase = createServiceClient();
  const { data: current } = await supabase.from("categories").select("id, parent_id").eq("id", id).single();
  if (!current) return;

  let siblingsQuery = supabase
    .from("categories")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  siblingsQuery =
    current.parent_id === null ? siblingsQuery.is("parent_id", null) : siblingsQuery.eq("parent_id", current.parent_id);
  const { data: siblings } = await siblingsQuery;
  if (!siblings) return;

  const ordered = siblings.map((s) => s.id).filter((sid) => sid !== id);
  const clampedIndex = Math.max(0, Math.min(newIndex, ordered.length));
  ordered.splice(clampedIndex, 0, id);

  await Promise.all(ordered.map((sid, i) => supabase.from("categories").update({ sort_order: i }).eq("id", sid)));

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  revalidateTag("categories");
  revalidateTag("products");
}
