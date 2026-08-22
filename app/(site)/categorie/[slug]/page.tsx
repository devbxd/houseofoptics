import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { listProducts } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { ProductGrid } from "@/components/ProductGrid";
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

  // The "New Product" category (flagged in Admin > Categories) lists
  // products manually added to it from their edit page, not products whose
  // category_id points here — that field is never set to it.
  const { products, total, pageSize } = await listProducts(
    category.is_new_product_category ? { onlyNewProduct: true } : { categorySlug: slug },
    page
  );
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
