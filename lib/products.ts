import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// A query that returns nothing looks identical whether that's the real
// answer or the query silently failed (e.g. a missing RLS policy) — this
// makes sure the latter shows up in server logs instead of just "this
// section looks empty" with no trace of why.
function logIfError(label: string, error: unknown) {
  if (error) console.error(label, error);
}

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
  // Set only on a per-color card produced by searchProducts — the product
  // itself is unchanged (still one row, one page), this just means the
  // card represents one specific color of it: its own photo/price/stock,
  // and a link that opens the product pre-selected to that color.
  variantColor?: string | null;
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
  const { data, error } = await query;
  logIfError(`Failed to resolve quick-added products from ${table}:`, error);
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
    const { data: cat, error: catError } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
    logIfError(`Failed to resolve category "${categorySlug}":`, catError);
    if (!cat) return { products: [], total: 0, pageSize };
    const [{ data: mainRows, error: mainError }, extraIds] = await Promise.all([
      supabase.from("products").select("id").eq("category_id", cat.id).eq("is_active", true),
      resolveExtraProductIds(supabase, "product_category_links", "category_id", cat.id, categorySlug === NEW_DROP_CATEGORY_SLUG),
    ]);
    logIfError(`Failed to load products for category "${categorySlug}":`, mainError);
    const ids = new Set([...(mainRows ?? []).map((r: any) => r.id), ...extraIds]);
    idFilter = Array.from(ids);
  }

  if (brandSlug) {
    const { data: brand, error: brandLookupError } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    logIfError(`Failed to resolve brand "${brandSlug}":`, brandLookupError);
    if (!brand) return { products: [], total: 0, pageSize };
    const [{ data: mainRows, error: mainError }, extraIds] = await Promise.all([
      supabase.from("products").select("id").eq("brand_id", brand.id).eq("is_active", true),
      resolveExtraProductIds(supabase, "product_brand_links", "brand_id", brand.id, false),
    ]);
    logIfError(`Failed to load products for brand "${brandSlug}":`, mainError);
    const ids = new Set([...(mainRows ?? []).map((r: any) => r.id), ...extraIds]);
    idFilter = idFilter ? idFilter.filter((id) => ids.has(id)) : Array.from(ids);
  }

  if (idFilter && idFilter.length === 0) return { products: [], total: 0, pageSize };

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, discount_percent, stock, is_sold_out, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("image_bytes", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (idFilter) query = query.in("id", idFilter);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, count, error } = await query;
  logIfError("Failed to load products:", error);
  const products = (data as any[])?.map((p) => ({
    ...p,
    stock: p.is_sold_out ? 0 : p.stock,
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

// Search results show one card per color a matched product comes in (each
// with that color's own photo/price/stock), plus the product's own base
// card — even though it's still a single product/page underneath (see
// VariantDetail in ProductDetailInteractive.tsx). Clicking a color card
// opens that same product pre-selected to that color via ?color=, where
// the dropdown still works normally. Matches ANYTHING the query could be:
// product name, SKU, brand name (main assignment or a quick-added extra
// brand), category name (main assignment or quick-added extra category),
// or a variant's color label — searching "Dita" finds every Dita product
// even if the word "Dita" never appears in a product's own name.
async function fetchSearchResults(
  query: string,
  page = 1,
  pageSize = PAGE_SIZE
): Promise<{ products: ProductCard[]; total: number; pageSize: number }> {
  const supabase = createPublicClient();
  const q = `%${query}%`;

  const [
    { data: nameMatches, error: nameError },
    { data: skuMatches, error: skuError },
    { data: colorMatches, error: colorError },
    { data: brandMatches, error: brandNameError },
    { data: categoryMatches, error: categoryNameError },
  ] = await Promise.all([
    supabase.from("products").select("id").eq("is_active", true).ilike("name", q),
    supabase.from("products").select("id").eq("is_active", true).ilike("sku", q),
    supabase.from("product_variants").select("product_id").ilike("color_label", q),
    supabase.from("brands").select("id").ilike("name", q),
    supabase.from("categories").select("id").ilike("name", q),
  ]);
  logIfError("Search: failed to match products by name:", nameError);
  logIfError("Search: failed to match products by SKU:", skuError);
  logIfError("Search: failed to match products by variant color:", colorError);
  logIfError("Search: failed to match brands by name:", brandNameError);
  logIfError("Search: failed to match categories by name:", categoryNameError);

  const brandIds = (brandMatches ?? []).map((r: any) => r.id);
  const categoryIds = (categoryMatches ?? []).map((r: any) => r.id);

  const [
    { data: brandProductRows, error: brandProductError },
    { data: brandLinkRows, error: brandLinkError },
    { data: categoryProductRows, error: categoryProductError },
    { data: categoryLinkRows, error: categoryLinkError },
  ] = await Promise.all([
    brandIds.length
      ? supabase.from("products").select("id").in("brand_id", brandIds).eq("is_active", true)
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    brandIds.length
      ? supabase.from("product_brand_links").select("product_id").in("brand_id", brandIds)
      : Promise.resolve({ data: [] as { product_id: string }[], error: null }),
    categoryIds.length
      ? supabase.from("products").select("id").in("category_id", categoryIds).eq("is_active", true)
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    categoryIds.length
      ? supabase.from("product_category_links").select("product_id").in("category_id", categoryIds)
      : Promise.resolve({ data: [] as { product_id: string }[], error: null }),
  ]);
  logIfError("Search: failed to match products by brand:", brandProductError);
  logIfError("Search: failed to match quick-added brand links:", brandLinkError);
  logIfError("Search: failed to match products by category:", categoryProductError);
  logIfError("Search: failed to match quick-added category links:", categoryLinkError);

  const matchedIds = Array.from(
    new Set([
      ...(nameMatches ?? []).map((r: any) => r.id),
      ...(skuMatches ?? []).map((r: any) => r.id),
      ...(colorMatches ?? []).map((r: any) => r.product_id),
      ...(brandProductRows ?? []).map((r: any) => r.id),
      ...(brandLinkRows ?? []).map((r: any) => r.product_id),
      ...(categoryProductRows ?? []).map((r: any) => r.id),
      ...(categoryLinkRows ?? []).map((r: any) => r.product_id),
    ])
  );
  if (matchedIds.length === 0) return { products: [], total: 0, pageSize };

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, discount_percent, stock, is_sold_out, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order), variants:product_variants(color_label, size_label, price, stock, image_url, image_urls)"
    )
    .in("id", matchedIds)
    .eq("is_active", true);
  logIfError("Search: failed to load matched products:", error);

  const cards: ProductCard[] = [];
  for (const p of (products as any[]) ?? []) {
    const category = Array.isArray(p.category) ? p.category[0] ?? null : p.category;
    const brand = Array.isArray(p.brand) ? p.brand[0] ?? null : p.brand;
    const images = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
    const baseStock = p.is_sold_out ? 0 : p.stock;

    cards.push({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      discount_percent: p.discount_percent,
      stock: baseStock,
      category,
      brand,
      images,
      variantColor: null,
    });

    const seenColors = new Set<string>();
    for (const v of p.variants ?? []) {
      if (!v.color_label || seenColors.has(v.color_label)) continue;
      // Falls back to the product's own main photo when this color has no
      // dedicated photos of its own — every color the product comes in
      // gets a card, not just the ones with their own uploaded photos.
      const photo = (v.image_urls && v.image_urls[0]) || v.image_url || images[0]?.url || null;
      if (!photo) continue; // this product has no photos anywhere, nothing to show
      seenColors.add(v.color_label);
      cards.push({
        id: `${p.id}::${v.color_label}`,
        name: p.name,
        slug: p.slug,
        price: v.price ?? p.price,
        discount_percent: v.price != null ? null : p.discount_percent,
        stock: p.is_sold_out ? 0 : v.stock ?? p.stock,
        category,
        brand,
        images: [{ url: photo }],
        variantColor: v.color_label,
      });
    }
  }

  const from = (page - 1) * pageSize;
  return { products: cards.slice(from, from + pageSize), total: cards.length, pageSize };
}

// Not wrapped in unstable_cache — a stale search (a color added in the
// admin staying invisible for shoppers) is worse than the cost of running
// this fresh every time. The Supabase queries it makes are already fast and
// no-store (see lib/supabase/*.ts), so there's no real caching win to give
// up here anyway.
export const searchProducts = fetchSearchResults;

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
      "sort_order, related:products!product_related_products_related_product_id_fkey(id, name, slug, price, discount_percent, stock, is_sold_out, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order))"
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
      stock: row.related.is_sold_out ? 0 : row.related.stock,
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
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, base_color, images:product_images(url, sort_order)")
    .eq("color_group_id", product.color_group_id)
    .eq("is_active", true)
    .neq("id", product.id);
  logIfError("Failed to load color siblings:", error);

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
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, sort_order), variants:product_variants(*)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  // PGRST116 is Postgrest's "no row found" for .single() — expected for a
  // real 404, not worth logging. Anything else is a real query failure
  // that would otherwise 404 a perfectly real product with no trace why.
  if (error && error.code !== "PGRST116") console.error(`Failed to load product "${slug}":`, error);

  if (!data) return null;
  const p = data as any;
  // Falls back to the older label/kind columns for rows saved before the
  // color_label/size_label migration ran, so nothing already entered is lost.
  const variants = (p.variants ?? [])
    .map((v: any) => ({
      ...v,
      color_label: v.color_label ?? (v.kind === "color" ? v.label : null),
      size_label: v.size_label ?? (v.kind === "size" ? v.label : null),
      // The manual "Sold out" override always wins over whatever stock
      // number is actually stored, on every color/size row — see
      // toggleSoldOut in admin/produits/actions.ts.
      stock: p.is_sold_out ? 0 : v.stock,
    }))
    .filter((v: any) => v.color_label || v.size_label)
    .sort((a: any, b: any) => a.sort_order - b.sort_order);
  return {
    ...p,
    stock: p.is_sold_out ? 0 : p.stock,
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
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, quote, rating, photo_url")
    .eq("product_id", productId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  logIfError("Failed to load product reviews:", error);
  return (data ?? []) as any[];
}

export const getProductReviews = unstable_cache(fetchProductReviews, ["product-reviews"], {
  tags: ["testimonials"],
  revalidate: REVALIDATE_SECONDS,
});

// For the sitemap only — every active product's slug, unpaginated.
async function fetchAllProductSlugs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select("slug, created_at").eq("is_active", true);
  logIfError("Failed to load product slugs for the sitemap:", error);
  return (data ?? []) as { slug: string; created_at: string | null }[];
}

export const getAllProductSlugs = unstable_cache(fetchAllProductSlugs, ["all-product-slugs"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});
