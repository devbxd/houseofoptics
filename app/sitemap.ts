import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { getBrands } from "@/lib/homepage";
import { SITE_URL } from "@/lib/site";

// Without this, switching to the cookie-free public client (needed so the
// underlying reads can go through unstable_cache) makes this route eligible
// for static generation — frozen at build/deploy time instead of picking up
// revalidateTag invalidations. force-dynamic keeps it running per-request
// like before; the actual caching now happens at the data layer.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, brands] = await Promise.all([getAllProductSlugs(), getCategories(), getBrands()]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/produits`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/categorie/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...brands.map((b: any) => ({
      url: `${SITE_URL}/marque/${b.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produit/${p.slug}`,
      lastModified: p.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
