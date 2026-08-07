import { createClient } from "@/lib/supabase/server";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  discount_percent: number | null;
  stock: number | null;
  category: { name: string; slug: string } | null;
  images: { url: string }[];
};

const PAGE_SIZE = 24;

export async function listProducts(
  categorySlug?: string,
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{ products: ProductCard[]; total: number; pageSize: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // A plain embedded filter (categories.slug=eq...) only shapes the nested
  // object, it does NOT restrict which product rows come back — Supabase
  // needs an explicit inner join for that. But forcing !inner always would
  // wrongly exclude every product that has no category at all, so only use
  // it when we're actually filtering by a category.
  const categoryRelation = categorySlug ? "categories!inner" : "categories";

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, price, discount_percent, stock, category:${categoryRelation}(name, slug), images:product_images(url, sort_order)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("image_bytes", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  const { data, count } = await query;
  const products = (data as any[])?.map((p) => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] ?? null : p.category,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) ?? [];

  return { products, total: count ?? 0, pageSize };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, price, discount_percent, stock, category:categories(name, slug), images:product_images(url, sort_order), variants:product_variants(id, label, stock, sort_order)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return null;
  const p = data as any;
  return {
    ...p,
    category: Array.isArray(p.category) ? p.category[0] ?? null : p.category,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    variants: (p.variants ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  };
}
