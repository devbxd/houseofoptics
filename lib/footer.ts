import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type FooterSection = {
  id: string;
  title: string;
  links: { id: string; label: string; url: string; sort_order: number }[];
};

async function fetchFooterSections(): Promise<FooterSection[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("footer_sections")
    .select("id, title, links:footer_links(id, label, url, sort_order)")
    .order("sort_order", { ascending: true });

  return ((data as any[]) ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    links: (s.links ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));
}

// Read on every page via the root layout — cached like the other
// site-wide layout data, invalidated instantly by revalidateTag("footer").
export const getFooterSections = unstable_cache(fetchFooterSections, ["footer-sections"], {
  tags: ["footer"],
  revalidate: 60,
});
