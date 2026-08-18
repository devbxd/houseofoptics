import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { BrandStrip } from "@/components/BrandStrip";
import { getServerDict } from "@/lib/locale-server";
import { getBrands } from "@/lib/homepage";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Toute la collection de lunettes et montures House of Optics.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ products, total, pageSize }, { t }, brands] = await Promise.all([
    listProducts({ search: q }, page),
    getServerDict(),
    getBrands(),
  ]);

  const basePath = q ? `/produits?q=${encodeURIComponent(q)}` : "/produits";

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-center font-serif text-2xl">{t["products.title"]}</h1>
        <ProductGrid products={products} t={t} />
        <Pagination page={page} total={total} pageSize={pageSize} basePath={basePath} />
      </div>

      <BrandStrip brands={brands ?? []} title={t["home.shopByBrand"]} />
    </main>
  );
}
