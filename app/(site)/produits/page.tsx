import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ products, total, pageSize }, { t }] = await Promise.all([
    listProducts(undefined, page),
    getServerDict(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{t["products.title"]}</h1>
      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/produits" />
    </main>
  );
}
