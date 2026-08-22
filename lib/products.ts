import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  discount_percent: number | null;
  stock: number | null;
  new_product_added_at: string | null;
  category: { name: string; slug: string } | null;
  brand: { name: string; slug: string } | null;
  images: { url: string }[];
};

const PAGE_SIZE = 24;
// Safety-net TTL — the real invalidation is the `revalidateTag("products")`
// calls in every admin product mutation, which bust this instantly. This
// just bounds staleness if a code path ever forgets to tag.
const REVALIDATE_SECONDS = 60;

// A product manually added to the "New Drop" category (Admin > Products >
// edit product > Add to New Drop button) stays listed there for this long,
// computed from new_product_added_at — no cron needed, it just ages out.
export const NEW_PRODUCT_DAYS = 15;

// The already-existing category (created by hand in Admin > Categories)
// that the "Add to New Drop" button links products to.
export const NEW_DROP_CATEGORY_SLUG = "new-drop";

async function fetchProducts(
  opts: { categorySlug?: string; brandSlug?: string; search?: string; onlyNewProduct?: boolean } = {},
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{ products: ProductCard[]; total: number; pageSize: number }> {
  const { categorySlug, brandSlug, search, onlyNewProduct } = opts;
  const supabase = createPublicClient();
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
      `id, name, slug, price, discount_percent, stock, new_product_added_at, category:${categoryRelation}(name, slug), brand:${brandRelation}(name, slug), images:product_images(url, sort_order)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("image_bytes", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  // The "New Product" category page shows products manually added to it
  // (Admin > Products > edit product > New Product button), not products
  // whose category_id points there — that field is never set to it.
  if (onlyNewProduct) {
    const cutoff = new Date(Date.now() - NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    query = query.not("new_product_added_at", "is", null).gte("new_product_added_at", cutoff);
  } else if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }
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

// Cached so 100 visitors browsing at once share one Supabase query instead
// of firing one each — invalidated instantly by revalidateTag("products")
// whenever a product/discount/stock/image changes in the admin.
export const listProducts = unstable_cache(fetchProducts, ["list-products"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchRelatedProducts(
  product: { id: string; category: { slug: string } | null; brand: { slug: string } | null },
  limit = 8
): Promise<ProductCard[]> {
  // A manual pick (Admin > Products > edit product > Related sunglasses)
  // always wins over the automatic category/brand matching below.
  const supabase = createPublicClient();
  const { data: manual } = await supabase
    .from("product_related_products")
    .select(
      "sort_order, related:products!product_related_products_related_product_id_fkey(id, name, slug, price, discount_percent, stock, new_product_added_at, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order))"
    )
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  if (manual && manual.length > 0) {
    return manual.map((row: any) => ({
      ...row.related,
      category: Array.isArray(row.related.category) ? row.related.category[0] ?? null : row.related.category,
      brand: Array.isArray(row.related.brand) ? row.related.brand[0] ?? null : row.related.brand,
      images: (row.related.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    })) as ProductCard[];
  }

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

export const getRelatedProducts = unstable_cache(fetchRelatedProducts, ["related-products"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

export type ColorSibling = { id: string; name: string; slug: string; image: string | null; base_color: string | null };

// Products tagged as "other colors" of this one (Admin > Products > edit
// product > Other colors) — shown as swatches so a shopper can jump between
// colorways without losing their place.
async function fetchColorSiblings(product: { id: string; color_group_id?: string | null }): Promise<ColorSibling[]> {
  if (!product.color_group_id) return [];
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, slug, base_color, images:product_images(url, sort_order)")
    .eq("color_group_id", product.color_group_id)
    .eq("is_active", true)
    .neq("id", product.id);

  return ((data as any[]) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    base_color: p.base_color ?? null,
    image: (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
}

export const getColorSiblings = unstable_cache(fetchColorSiblings, ["color-siblings"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchProductBySlug(slug: string) {
  const supabase = createPublicClient();
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

export const getProductBySlug = unstable_cache(fetchProductBySlug, ["product-by-slug"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchProductReviews(productId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id, author_name, quote, rating, photo_url")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as any[];
}

export const getProductReviews = unstable_cache(fetchProductReviews, ["product-reviews"], {
  tags: ["testimonials"],
  revalidate: REVALIDATE_SECONDS,
});

// For the sitemap only — every active product's slug, unpaginated.
async function fetchAllProductSlugs() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("slug, created_at").eq("is_active", true);
  return (data ?? []) as { slug: string; created_at: string | null }[];
}

export const getAllProductSlugs = unstable_cache(fetchAllProductSlugs, ["all-product-slugs"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});
