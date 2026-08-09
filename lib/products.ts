import { createClient } from "@/lib/supabase/server";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  discount_percent: number | null;
  stock: number | null;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  images: { url: string }[];
};

const PAGE_SIZE = 24;

export async function listProducts(
  opts: { categorySlug?: string; brandSlug?: string; search?: string } = {},
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{ products: ProductCard[]; total: number; pageSize: number }> {
  const { categorySlug, brandSlug, search } = opts;
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // A plain embedded filter (categories.slug=eq...) only shapes the nested
  // object, it does NOT restrict which product rows come back — Supabase
  // needs an explicit inner join for that. But forcing !inner always would
  // wrongly exclude every product missing that relation, so only use it
  // when actually filtering on it.
  const categoryRelation = categorySlug ? "categories!inner" : "categories";
  const brandRelation = brandSlug ? "brands!inner" : "brands";

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, price, discount_percent, stock, category:${categoryRelation}(name, slug), brand:${brandRelation}(name, slug), images:product_images(url, sort_order)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("image_bytes", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (categorySlug) query = query.eq("categories.slug", categorySlug);
  if (brandSlug) query = query.eq("brands.slug", brandSlug);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count } = await query;
  const products = (data as any[])?.map((p) => ({
    ...p,
    category: Array.isArray(p.category) ? p.category[0] ?? null : p.category,
    brand: Array.isArray(p.brand) ? p.brand[0] ?? null : p.brand,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  })) ?? [];

  return { products, total: count ?? 0, pageSize };
}

export async function getRelatedProducts(
  product: { id: string; category: { slug: string } | null; brand: { slug: string } | null },
  limit = 8
): Promise<ProductCard[]> {
  // Prefer same category, fall back to same brand, then just recent products
  // — most products don't have a category assigned yet, and the section
  // should still show something useful instead of disappearing.
  const attempts: { categorySlug?: string; brandSlug?: string }[] = [];
  if (product.category) attempts.push({ categorySlug: product.category.slug });
  if (product.brand) attempts.push({ brandSlug: product.brand.slug });
  attempts.push({});

  for (const opts of attempts) {
    const { products } = await listProducts(opts, 1, limit + 1);
    const filtered = products.filter((p) => p.id !== product.id).slice(0, limit);
    if (filtered.length > 0) return filtered;
  }
  return [];
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "*, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order), variants:product_variants(*)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!data) return null;
  const p = data as any;
  // Falls back to the older label/kind columns for rows saved before the
  // color_label/size_label migration ran, so nothing already entered is lost.
  const variants = (p.variants ?? [])
    .map((v: any) => ({
      ...v,
      color_label: v.color_label ?? (v.kind === "color" ? v.label : null),
      size_label: v.size_label ?? (v.kind === "size" ? v.label : null),
    }))
    .filter((v: any) => v.color_label || v.size_label)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  return {
    ...p,
    category: Array.isArray(p.category) ? p.category[0] ?? null : p.category,
    brand: Array.isArray(p.brand) ? p.brand[0] ?? null : p.brand,
    images: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    variants,
  };
}
