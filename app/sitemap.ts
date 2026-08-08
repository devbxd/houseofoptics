import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from("products").select("slug, created_at").eq("is_active", true),
    supabase.from("categories").select("slug"),
    supabase.from("brands").select("slug"),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/produits`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...(categories ?? []).map((c) => ({
      url: `${SITE_URL}/categorie/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(brands ?? []).map((b) => ({
      url: `${SITE_URL}/marque/${b.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...(products ?? []).map((p) => ({
      url: `${SITE_URL}/produit/${p.slug}`,
      lastModified: p.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
