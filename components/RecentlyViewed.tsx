"use client";

import { useEffect, useState } from "react";
import type { ProductCard } from "@/lib/products";
import { trackProductView, getRecentlyViewed } from "@/lib/recently-viewed";
import { ProductGrid } from "./ProductGrid";

export function RecentlyViewed({ current, t }: { current: ProductCard; t: Record<string, string> }) {
  const [products, setProducts] = useState<ProductCard[]>([]);

  useEffect(() => {
    // Read the list from before this view was recorded, so the product
    // being looked at right now never shows up in its own "recently
    // viewed" row.
    setProducts(getRecentlyViewed(current.id));
    trackProductView(current);
  }, [current]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-neutral-200 pt-10">
      <h2 className="mb-8 text-center font-serif text-2xl">{t["product.recentlyViewed"]}</h2>
      <ProductGrid products={products} t={t} />
    </section>
  );
}
