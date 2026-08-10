import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: productCount },
    { count: categoryCount },
    { count: orderCount },
    { count: visitCount },
    { count: visitCount7d },
    { count: subscriberCount },
    { data: wishlistRows },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("site_visits").select("*", { count: "exact", head: true }),
    supabase.from("site_visits").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
    supabase.from("wishlist_events").select("product_id").order("created_at", { ascending: false }).limit(5000),
  ]);

  const stats = [
    { label: "Products", value: productCount ?? 0 },
    { label: "Categories", value: categoryCount ?? 0 },
    { label: "Orders", value: orderCount ?? 0 },
    { label: "Newsletter subscribers", value: subscriberCount ?? 0 },
    { label: "Site visits (all time)", value: visitCount ?? 0 },
    { label: "Site visits (last 7 days)", value: visitCount7d ?? 0 },
  ];

  // wishlist_events has no product info of its own — tally counts here,
  // then fetch just the top products' details.
  const wishlistCounts = new Map<string, number>();
  for (const row of wishlistRows ?? []) {
    wishlistCounts.set(row.product_id, (wishlistCounts.get(row.product_id) ?? 0) + 1);
  }
  const topIds = [...wishlistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const { data: topProducts } = topIds.length
    ? await supabase
        .from("products")
        .select("id, name, images:product_images(url, sort_order)")
        .in(
          "id",
          topIds.map(([id]) => id)
        )
    : { data: [] };

  const mostWishlisted = topIds
    .map(([id, count]) => {
      const p = (topProducts ?? []).find((p: any) => p.id === id);
      if (!p) return null;
      const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
      return { id, count, name: p.name, image: img?.url as string | undefined };
    })
    .filter((p): p is { id: string; count: number; name: string; image: string | undefined } => p !== null);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:max-w-2xl">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-neutral-200 bg-white p-6">
            <p className="text-3xl font-semibold">{s.value}</p>
            <p className="text-sm text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      {mostWishlisted.length > 0 && (
        <div className="mt-8 max-w-2xl">
          <h2 className="mb-3 font-serif text-lg">Most wishlisted</h2>
          <div className="divide-y divide-neutral-100 rounded-md border border-neutral-200 bg-white">
            {mostWishlisted.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                  {p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <p className="flex-1 truncate text-sm">{p.name}</p>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  {p.count} wishlist{p.count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
