import Image from "next/image";
import Link from "next/link";
import type { ProductCard } from "@/lib/products";

export function ProductGrid({ products, t }: { products: ProductCard[]; t: Record<string, string> }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-neutral-500">{t["products.empty"]}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const hasDiscount = !!p.discount_percent && p.discount_percent > 0 && p.price != null;
        const discountedPrice = hasDiscount ? Number(p.price) * (1 - p.discount_percent! / 100) : null;

        return (
          <Link key={p.id} href={`/produit/${p.slug}`} className="group">
            <div className="relative aspect-square overflow-hidden bg-neutral-100">
              {p.images[0] && (
                <Image
                  src={p.images[0].url}
                  alt={p.name}
                  fill
                  quality={90}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {p.category && (
                <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wide text-neutral-700">
                  {p.category.name}
                </span>
              )}
              {hasDiscount && (
                <span className="absolute right-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  -{p.discount_percent}%
                </span>
              )}
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
    </div>
  );
}
