import Image from "next/image";
import Link from "next/link";
import { isNewDrop, type ProductCard } from "@/lib/products";
import { WishlistButton } from "./WishlistButton";
import { ScrollReveal } from "./ScrollReveal";

export function ProductGrid({ products, t }: { products: ProductCard[]; t: Record<string, string> }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-neutral-500">{t["products.empty"]}</p>;
  }

  return (
    <ScrollReveal className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => {
        const hasDiscount = !!p.discount_percent && p.discount_percent > 0 && p.price != null;
        const discountedPrice = hasDiscount ? Number(p.price) * (1 - p.discount_percent! / 100) : null;
        const isNew = isNewDrop(p.created_at);

        return (
          <Link
            key={p.id}
            href={`/produit/${p.slug}`}
            className="group"
            data-reveal
            style={{ transitionDelay: `${(i % 8) * 60}ms` }}
          >
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              {p.images[0] && (
                <Image
                  src={p.images[0].url}
                  alt={p.name}
                  fill
                  // Product photos are already resized/compressed server-side at
                  // upload (see lib/process-image.ts) and served from Supabase
                  // with a long cache lifetime — routing them through Next's
                  // image optimizer too just adds a redundant fetch+resize hop
                  // (and extra Supabase egress) on every first view.
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
                {isNew && (
                  <span className="bg-brand-red px-2.5 py-1 text-[10px] uppercase tracking-wide text-white shadow">
                    {t["product.newDrop"]}
                  </span>
                )}
                {p.category && (
                  <span className="bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-neutral-700">
                    {p.category.name}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="absolute right-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  -{p.discount_percent}%
                </span>
              )}
              <WishlistButton
                item={{ productId: p.id, variant: null, slug: p.slug, name: p.name, price: p.price, image: p.images[0]?.url ?? null, stock: p.stock }}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition-colors hover:text-brand-red"
                iconClassName="h-4 w-4"
              />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-neutral-800 group-hover:text-brand-red">{p.name}</p>
              {hasDiscount ? (
                <p className="mt-1 space-x-2 text-sm">
                  <span className="text-neutral-400 line-through">${Number(p.price).toFixed(2)}</span>
                  <span className="font-medium text-brand-red">${discountedPrice!.toFixed(2)}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-neutral-500">
                  {p.price != null ? `$${Number(p.price).toFixed(2)}` : t["product.priceOnRequest"]}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </ScrollReveal>
  );
}
