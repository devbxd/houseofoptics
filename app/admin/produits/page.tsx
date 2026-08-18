import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductDeleteButton } from "./ProductDeleteButton";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 30;

export default async function AdminProductsPage({
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

  let query = supabase
    .from("products")
    .select("id, name, price, is_active, discount_percent, category:categories(name), images:product_images(url, sort_order)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, count } = await query;
  const basePath = search ? `/admin/produits?q=${encodeURIComponent(search)}` : "/admin/produits";

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-2xl">Products {count != null && <span className="text-sm font-normal text-neutral-400">({count})</span>}</h1>
          <Link
            href="/admin/produits/nouveau"
            className="shrink-0 bg-brand-black px-4 py-2 text-xs uppercase tracking-wide text-white hover:opacity-90 sm:px-5 sm:text-sm"
          >
            New product
          </Link>
        </div>
        <form>
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name..."
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none sm:max-w-xs"
          />
        </form>
      </div>

      {(products?.length ?? 0) === 0 && (
        <p className="py-16 text-center text-sm text-neutral-500">
          {/* Reachable by deleting the last product on a page — without this
              the grid just goes blank with no explanation, while the header
              count and pagination still reference a page that no longer
              has anything on it. */}
          {page > 1 ? (
            <>
              Nothing on this page.{" "}
              <Link href={search ? `/admin/produits?q=${encodeURIComponent(search)}` : "/admin/produits"} className="underline hover:text-brand-black">
                Go back to page 1
              </Link>
              .
            </>
          ) : (
            "No products found."
          )}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products as any[] ?? []).map((p) => {
          const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
          const category = Array.isArray(p.category) ? p.category[0] : p.category;
          return (
            <div key={p.id} className="rounded-md border border-neutral-200 bg-white p-3">
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-neutral-100">
                {img && <Image src={img.url} alt={p.name} fill sizes="300px" className="object-cover" />}
                {!p.is_active && (
                  <span className="absolute left-2 top-2 rounded bg-neutral-900/80 px-2 py-0.5 text-xs text-white">Hidden</span>
                )}
                {!!p.discount_percent && (
                  <span className="absolute right-2 top-2 rounded-full bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
                    -{p.discount_percent}%
                  </span>
                )}
              </div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-neutral-500">{category?.name ?? "No category"}</p>
              <p className="text-sm text-neutral-700">{p.price != null ? `$${Number(p.price).toFixed(2)}` : "Price to set"}</p>
              <div className="mt-2 flex gap-3 text-sm">
                <Link href={`/admin/produits/${p.id}`} className="text-neutral-600 hover:text-brand-black">
                  Edit
                </Link>
                <ProductDeleteButton productId={p.id} productName={p.name} />
              </div>
            </div>
          );
        })}
      </div>

      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={basePath} />
    </div>
  );
}
