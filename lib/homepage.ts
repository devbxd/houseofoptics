import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

const REVALIDATE_SECONDS = 60;

async function fetchBrands() {
  const supabase = createPublicClient();
  // select("*") rather than naming featured_on_homepage/homepage_banner_url
  // — they come from a migration that may not have run yet.
  const { data } = await supabase.from("brands").select("*").order("sort_order", { ascending: true });
  return (data ?? []) as any[];
}

export const getBrands = unstable_cache(fetchBrands, ["brands"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

export type BrandCard = { id: string; name: string; slug: string; image: string | null; count: number };

// Powers the "All Brands" category page (real brand cards with a photo and
// a real product count each) plus that category's own tile/total on the
// homepage — counting main brand_id matches UNION quick-added
// product_brand_links, deduped, per brand and across all brands combined.
async function fetchBrandsWithCounts(): Promise<{ brands: BrandCard[]; totalProducts: number }> {
  const supabase = createPublicClient();
  const { data: brandRows } = await supabase.from("brands").select("*").order("sort_order", { ascending: true });
  const list = (brandRows ?? []) as any[];

  const globalIds = new Set<string>();
  const brands = await Promise.all(
    list.map(async (b) => {
      const [{ data: mainRows }, { data: linkRows }] = await Promise.all([
        supabase
          .from("products")
          .select("id, images:product_images(url, sort_order)")
          .eq("brand_id", b.id)
          .eq("is_active", true)
          .order("image_bytes", { ascending: false, nullsFirst: false }),
        supabase
          .from("product_brand_links")
          .select("product:products!inner(id, is_active, images:product_images(url, sort_order))")
          .eq("brand_id", b.id)
          .eq("products.is_active", true),
      ]);

      const linkedProducts = (linkRows ?? [])
        .map((r: any) => (Array.isArray(r.product) ? r.product[0] : r.product))
        .filter(Boolean);
      const byId = new Map<string, any>();
      for (const p of [...(mainRows ?? []), ...linkedProducts]) byId.set(p.id, p);
      for (const id of byId.keys()) globalIds.add(id);

      const firstImage = Array.from(byId.values())
        .flatMap((p: any) => (p.images ?? []).slice().sort((a: any, c: any) => a.sort_order - c.sort_order))[0]?.url;

      return {
        id: b.id as string,
        name: b.name as string,
        slug: b.slug as string,
        image: b.logo_url || firstImage || null,
        count: byId.size,
      };
    })
  );

  return { brands, totalProducts: globalIds.size };
}

export const getBrandsWithCounts = unstable_cache(fetchBrandsWithCounts, ["brands-with-counts"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchActiveTestimonials() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("testimonials")
    .select("id, author_name, quote, rating, photo_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as any[];
}

export const getActiveTestimonials = unstable_cache(fetchActiveTestimonials, ["active-testimonials"], {
  tags: ["testimonials"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchFeedbackProducts() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("products").select("id, name").eq("is_active", true).order("name", { ascending: true });
  return (data ?? []) as any[];
}

export const getFeedbackProducts = unstable_cache(fetchFeedbackProducts, ["feedback-products"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

async function fetchModelPhotos() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("model_photos")
    .select("id, image_url, product:products(name, slug)")
    .order("sort_order", { ascending: true });
  return ((data as any[]) ?? []).map((p) => ({
    id: p.id,
    image_url: p.image_url,
    product: Array.isArray(p.product) ? p.product[0] ?? null : p.product,
  }));
}

export const getModelPhotos = unstable_cache(fetchModelPhotos, ["model-photos"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

// Custom uploaded slides (Admin > Hero) plus product photos manually marked
// "use as hero" (Admin > Hero > pick from product images) — combined in one
// cached read since the homepage always needs both together.
async function fetchHeroData() {
  const supabase = createPublicClient();
  const [{ data: customSlides }, { data: manualHero }] = await Promise.all([
    supabase.from("hero_slides").select("id, image_url, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("product_images")
      .select("url, sort_order, hero_order, products(name)")
      .eq("is_hero", true)
      .order("hero_order", { ascending: true }),
  ]);

  const customHeroImages = (customSlides ?? []).map((s) => ({ id: s.id, name: "", url: s.image_url }));
  const manualHeroImages =
    (manualHero as any[])?.map((img, i) => ({
      id: `${img.url}-${i}`,
      name: img.products?.name ?? "",
      url: img.url,
    })) ?? [];

  return { customHeroImages, manualHeroImages };
}

export const getHeroData = unstable_cache(fetchHeroData, ["hero-data"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});

// One representative photo per category tile, best quality first per
// category so the tile isn't stuck with whatever product was added last.
async function fetchCategoryPhotoMap(categoryIds: string[]) {
  if (categoryIds.length === 0) return { imageById: {} as Record<string, string>, countById: {} as Record<string, number> };

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("category_id, images:product_images(url, sort_order)")
    .eq("is_active", true)
    .in("category_id", categoryIds)
    .order("image_bytes", { ascending: false, nullsFirst: false });

  const imageById: Record<string, string> = {};
  const countById: Record<string, number> = {};
  for (const row of (data as any[]) ?? []) {
    if (!row.category_id) continue;
    countById[row.category_id] = (countById[row.category_id] ?? 0) + 1;
    if (imageById[row.category_id]) continue;
    const img = (row.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
    if (img) imageById[row.category_id] = img.url;
  }
  return { imageById, countById };
}

export const getCategoryPhotoMap = unstable_cache(fetchCategoryPhotoMap, ["category-photo-map"], {
  tags: ["products"],
  revalidate: REVALIDATE_SECONDS,
});
