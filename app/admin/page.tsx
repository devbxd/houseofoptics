import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: productCount },
    { count: categoryCount },
    { count: orderCount },
    { count: visitCount },
    { count: visitCount7d },
    { count: subscriberCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("*", { count: "exact", head: true }),
    supabase.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Products", value: productCount ?? 0 },
    { label: "Categories", value: categoryCount ?? 0 },
    { label: "Orders", value: orderCount ?? 0 },
    { label: "Newsletter subscribers", value: subscriberCount ?? 0 },
    { label: "Site visits (all time)", value: visitCount ?? 0 },
    { label: "Site visits (last 7 days)", value: visitCount7d ?? 0 },
  ];

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
    </div>
  );
}
