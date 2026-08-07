import { notFound } from "next/navigation";
import { listProducts } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [categories, { t }] = await Promise.all([getCategories(), getServerDict()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const { products, total, pageSize } = await listProducts(slug, page);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{category.name}</h1>
      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath={`/categorie/${slug}`} />
    </main>
  );
}
