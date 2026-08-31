import { searchProducts, debugProductVariantsRaw } from "@/lib/products";
import { ProductGrid } from "@/components/ProductGrid";
import { Pagination } from "@/components/Pagination";
import { getServerDict } from "@/lib/locale-server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; debugpid?: string }>;
}) {
  const { q, page: pageParam, debugpid } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam) || 1);

  if (debugpid) {
    const result = await debugProductVariantsRaw(debugpid);
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(result, null, 2)}</pre>
      </main>
    );
  }

  const [{ products, total, pageSize }, { t }] = await Promise.all([
    search ? searchProducts(search, page) : Promise.resolve({ products: [], total: 0, pageSize: 24 }),
    getServerDict(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <form className="mx-auto mb-10 flex max-w-lg gap-2">
        <input
          name="q"
          defaultValue={search}
          placeholder={t["search.placeholder"]}
          autoFocus
          className="flex-1 border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-black focus:outline-none"
        />
        <button
          type="submit"
          className="bg-brand-black px-6 py-2.5 text-xs uppercase tracking-wide text-white hover:opacity-90"
        >
          {t["search.button"]}
        </button>
      </form>

      {search ? (
        <>
          <p className="mb-6 text-center text-sm text-neutral-500">
            {(total === 1 ? t["search.resultsForOne"] : t["search.resultsForMany"]).replace("{count}", String(total))}{" "}
            &ldquo;{search}&rdquo;
          </p>
          <ProductGrid products={products} t={t} />
          <Pagination page={page} total={total} pageSize={pageSize} basePath={`/recherche?q=${encodeURIComponent(search)}`} />
        </>
      ) : (
        <p className="text-center text-sm text-neutral-500">{t["search.emptyPrompt"]}</p>
      )}
    </main>
  );
}
