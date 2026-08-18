import { notFound } from "next/navigation";
import { listProducts } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";
import { getBrands } from "@/lib/homepage";

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [brands, { t }] = await Promise.all([getBrands(), getServerDict()]);
  const brand = brands?.find((b: any) => b.slug === slug);
  if (!brand) notFound();

  const { products, total, pageSize } = await listProducts({ brandSlug: slug }, page);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{brand.name}</h1>
      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath={`/marque/${slug}`} />
    </main>
  );
}
