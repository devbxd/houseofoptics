import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, ALL_BRANDS_CATEGORY_SLUG } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { getBrandsWithCounts } from "@/lib/homepage";
import { ProductGrid } from "@/components/ProductGrid";
import { BrandGrid } from "@/components/BrandGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: category.name,
    description: `Découvrez notre sélection ${category.name} chez House of Optics.`,
  };
}

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

  // "All Brands" is a real brand directory (cards with logo + count from
  // the brands table), not a normal product grid — its sub-categories are
  // legacy and no longer drive what shows here.
  if (slug === ALL_BRANDS_CATEGORY_SLUG) {
    const { brands } = await getBrandsWithCounts();
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-center font-serif text-2xl">{category.name}</h1>
        <BrandGrid brands={brands} shopNowLabel={t["home.shopNow"]} productsLabel={t["home.productsCount"]} />
      </main>
    );
  }

  const { products, total, pageSize } = await listProducts({ categorySlug: slug }, page);
  const children = categories.filter((c) => c.parent_id === category.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-center font-serif text-2xl">{category.name}</h1>

      {children.length > 0 && (
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {children.map((c) => (
            <Link
              key={c.id}
              href={`/categorie/${c.slug}`}
              className="rounded-full border border-neutral-300 px-6 py-2.5 text-xs uppercase tracking-wide transition-colors hover:border-brand-black hover:bg-brand-black hover:text-white"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid products={products} t={t} />
      <Pagination page={page} total={total} pageSize={pageSize} basePath={`/categorie/${slug}`} />
    </main>
  );
}
