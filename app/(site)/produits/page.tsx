import Link from "next/link";
import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Toute la collection de lunettes et montures House of Optics.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; brand?: string; q?: string }>;
}) {
  const { page: pageParam, brand, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const [{ products, total, pageSize }, { t }, { data: brands }] = await Promise.all([
    listProducts({ brandSlug: brand, search: q }, page),
    getServerDict(),
    supabase.from("brands").select("id, name, slug").order("sort_order", { ascending: true }),
  ]);

  const activeBrand = brands?.find((b) => b.slug === brand);
  const params = new URLSearchParams();
  if (brand) params.set("brand", brand);
  if (q) params.set("q", q);
  const basePath = params.toString() ? `/produits?${params.toString()}` : "/produits";

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{activeBrand ? activeBrand.name : t["products.title"]}</h1>

      {brands && brands.length > 0 && (
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          <Link
            href="/produits"
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wide ${
              !brand ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 hover:border-brand-black"
            }`}
          >
            All brands
          </Link>
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/produits?brand=${b.slug}`}
              className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wide ${
                brand === b.slug ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 hover:border-brand-black"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath={basePath} />
    </main>
  );
}
