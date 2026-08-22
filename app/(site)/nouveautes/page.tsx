import type { Metadata } from "next";
import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";

export const metadata: Metadata = {
  title: "New Drop",
  description: "Les dernières nouveautés House of Optics.",
};

export default async function NewDropPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ products, total, pageSize }, { t }] = await Promise.all([
    listProducts({ onlyNewDrop: true }, page),
    getServerDict(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{t["nav.newDrop"]}</h1>
      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath="/nouveautes" />
    </main>
  );
}
