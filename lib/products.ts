import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

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
// Safety-net TTL — the real invalidation is the `revalidateTag("products")`
// calls in every admin product mutation, which bust this instantly. This
// just bounds staleness if a code path ever forgets to tag.
const REVALIDATE_SECONDS = 60;

// A product manually added to the "New Drop" category (Admin > Products >
// edit product > "Add to category" picker) stays listed there for this
// long, computed from product_category_links.added_at — no cron needed.
export const NEW_PRODUCT_DAYS = 15;

// The already-existing category (created by hand in Admin > Categories)
// that carries the 15-day auto-expiry — every other quick-added category
// tag is permanent.
export const NEW_DROP_CATEGORY_SLUG = "new-drop";

// The umbrella category whose page shows the real brand directory (cards
// with logo + product count) instead of a normal product grid.
export const ALL_BRANDS_CATEGORY_SLUG = "all-brands";

// A category/brand page shows products assigned to it the normal way
// (category_id/brand_id) UNION products manually tagged into it from the
// edit page (product_category_links/product_brand_links) — the "quick add"
// system works on top of, not instead of, the real assignment.
async function resolveExtraProductIds(
  supabase: ReturnType<typeof createPublicClient>,
  table: "product_category_links" | "product_brand_links",
  column: "category_id" | "brand_id",
  targetId: string,
  applyNewDropCutoff: boolean
) {
  let query = supabase.from(table).select("product_id, added_at").eq(column, targetId);
  if (applyNewDropCutoff) {
    const cutoff = new Date(Date.now() - NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("added_at", cutoff);
  }
  const { data } = await query;
  return (data ?? []).map((r: any) => r.product_id as string);
}

async function fetchProducts(
  opts: { categorySlug?: string; brandSlug?: string; search?: string } = {},
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{ products: ProductCard[]; total: number; pageSize: number }> {
  const { categorySlug, brandSlug, search } = opts;
  const supabase = createPublicClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // categorySlug/brandSlug now resolve to an explicit id list (main
  // assignment UNION quick-added tags) rather than a relational filter, so
  // quick-added products show up here too.
  let idFilter: string[] | null = null;

  if (categorySlug) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
    if (!cat) return { products: [], total: 0, pageSize };
    const [{ data: mainRows }, extraIds] = await Promise.all([
      supabase.from("products").select("id").eq("category_id", cat.id).eq("is_active", true),
      resolveExtraProductIds(supabase, "product_category_links", "category_id", cat.id, categorySlug === NEW_DROP_CATEGORY_SLUG),
    ]);
    const ids = new Set([...(mainRows ?? []).map((r: any) => r.id), ...extraIds]);
    idFilter = Array.from(ids);
  }

  if (brandSlug) {
    const { data: brand } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    if (!brand) return { products: [], total: 0, pageSize };
    const [{ data: mainRows }, extraIds] = await Promise.all([
      supabase.from("products").select("id").eq("brand_id", brand.id).eq("is_active", true),
      resolveExtraProductIds(supabase, "product_brand_links", "brand_id", brand.id, false),
    ]);
    const ids = new Set([...(mainRows ?? []).map((r: any) => r.id), ...extraIds]);
    idFilter = idFilter ? idFilter.filter((id) => ids.has(id)) : Array.from(ids);
  }

  if (idFilter && idFilter.length === 0) return { products: [], total: 0, pageSize };

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, discount_percent, stock, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("image_bytes", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (idFilter) query = query.in("id", idFilter);
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
  const { data: manual, error: manualError } = await supabase
    .from("product_related_products")
    .select(
      "sort_order, related:products!product_related_products_related_product_id_fkey(id, name, slug, price, discount_percent, stock, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order))"
    )
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  // A manual pick failing to load (e.g. a missing RLS policy on this
  // table) used to silently fall through to the automatic matching below
  // with no trace of why — log it so a future regression here is visible
  // in the server logs instead of just "related products look wrong".
  if (manualError) console.error("Failed to load manual related products:", manualError);

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
