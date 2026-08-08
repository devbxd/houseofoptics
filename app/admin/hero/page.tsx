import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/Pagination";
import { HeroImageToggle } from "./HeroImageToggle";

const PAGE_SIZE = 24;

export default async function AdminHeroPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = (q ?? "").trim();

  const supabase = createServiceClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: current } = await supabase
    .from("product_images")
    .select("id, url, hero_order, products(name)")
    .eq("is_hero", true)
    .order("hero_order", { ascending: true });

  let query = supabase
    .from("products")
    .select("id, name, images:product_images(id, url, sort_order, is_hero)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, count } = await query;
  const basePath = search ? `/admin/hero?q=${encodeURIComponent(search)}` : "/admin/hero";

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Homepage carousel</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Pick which photos scroll on the homepage. If none are selected, the site automatically shows the
        sharpest recent photos instead.
      </p>

      {current && current.length > 0 && (
        <div className="mb-8 rounded-md border border-neutral-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium">Currently in the carousel ({current.length})</p>
          <div className="flex flex-wrap gap-3">
            {current.map((img: any) => (
              <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded border border-neutral-200">
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="mb-6">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name..."
          className="w-full max-w-xs border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(products ?? []).map((p: any) => {
          const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
          if (!img) return null;
          return (
            <div key={p.id} className="rounded-md border border-neutral-200 bg-white p-2">
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-neutral-100">
                <Image src={img.url} alt={p.name} fill sizes="200px" className="object-cover" />
              </div>
              <p className="mb-2 truncate text-xs text-neutral-600">{p.name}</p>
              <HeroImageToggle imageId={img.id} initialIsHero={!!img.is_hero} />
            </div>
          );
        })}
      </div>

      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={basePath} />
    </div>
  );
}
