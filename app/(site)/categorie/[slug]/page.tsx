import { notFound } from "next/navigation";
import Link from "next/link";
import { listProducts } from "@/lib/products";
import { getCategories } from "@/lib/settings";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";
import { EVENT_THEME_BY_SLUG, EVENT_BG_CLASS, EventDecor } from "@/components/events/EventTheme";

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

  const { products, total, pageSize } = await listProducts({ categorySlug: slug }, page);
  const children = categories.filter((c) => c.parent_id === category.id);
  const eventTheme = EVENT_THEME_BY_SLUG[slug];

  return (
    <main className={eventTheme ? `min-h-screen ${EVENT_BG_CLASS[eventTheme]}` : undefined}>
      {eventTheme && <EventDecor theme={eventTheme} />}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-center font-serif text-2xl">{category.name}</h1>

        {children.length > 0 && (
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/categorie/${c.slug}`}
                className={
                  eventTheme
                    ? "rounded-full border border-white/40 px-6 py-2.5 text-xs uppercase tracking-wide transition-colors hover:bg-white/10"
                    : "rounded-full border border-neutral-300 px-6 py-2.5 text-xs uppercase tracking-wide transition-colors hover:border-brand-black hover:bg-brand-black hover:text-white"
                }
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {eventTheme ? (
          <div className="rounded-lg bg-white/95 p-5 shadow-xl md:p-8">
            <ProductGrid products={products} t={t} />
            <Pagination page={page} total={total} pageSize={pageSize} basePath={`/categorie/${slug}`} />
          </div>
        ) : (
          <>
            <ProductGrid products={products} t={t} />
            <Pagination page={page} total={total} pageSize={pageSize} basePath={`/categorie/${slug}`} />
          </>
        )}
      </div>
    </main>
  );
}
