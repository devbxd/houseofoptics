import type { ProductCard } from "@/lib/products";
import { ProductCardTile } from "./ProductCardTile";
import { ScrollReveal } from "./ScrollReveal";

export function ProductGrid({ products, t }: { products: ProductCard[]; t: Record<string, string> }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-neutral-500">{t["products.empty"]}</p>;
  }

  return (
    <ScrollReveal className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCardTile key={p.id} product={p} t={t} reveal style={{ transitionDelay: `${(i % 8) * 60}ms` }} />
      ))}
    </ScrollReveal>
  );
}
