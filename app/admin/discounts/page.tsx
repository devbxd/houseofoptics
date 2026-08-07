import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/Pagination";
import { DiscountRow } from "./DiscountRow";

const PAGE_SIZE = 30;

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = (q ?? "").trim();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("products")
    .select("id, name, price, discount_percent, images:product_images(url, sort_order)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, count } = await query;
  const basePath = search ? `/admin/discounts?q=${encodeURIComponent(search)}` : "/admin/discounts";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl">Discounts</h1>
        <form>
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name..."
            className="border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </form>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Set a discount percentage on any product — it shows a red badge with the percentage on the site.
      </p>

      <div className="space-y-3">
        {(products as any[] ?? []).map((p) => {
          const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
          return (
            <DiscountRow
              key={p.id}
              product={{ id: p.id, name: p.name, price: p.price, discount_percent: p.discount_percent, image: img?.url ?? null }}
            />
          );
        })}
      </div>

      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={basePath} />
    </div>
  );
}
