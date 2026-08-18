"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/components/WishlistProvider";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/lib/locale-client";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();
  const { t } = useLocale();

  if (items.length === 0) {
    return (
      <main className="px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-serif text-2xl">{t["wishlist.empty"] ?? "Your wishlist is empty"}</h1>
          <Link
            href="/produits"
            className="mt-6 inline-block border border-brand-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-brand-black hover:text-white"
          >
            {t["cart.viewCollection"]}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 font-serif text-2xl">{t["wishlist.title"] ?? "Wishlist"}</h1>

        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((item) => {
            // Stock is a snapshot from whenever this was wishlisted, same
            // limitation the product page doesn't have (it reads live) —
            // still enough to stop the obvious case of ordering something
            // that was already out of stock when it was saved here.
            const outOfStock = item.stock != null && item.stock <= 0;
            return (
              <div key={`${item.productId}-${item.variant ?? ""}`} className="flex items-center gap-4 py-4">
                <Link href={`/produit/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-neutral-100">
                  {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                </Link>
                <div className="flex-1">
                  <Link href={`/produit/${item.slug}`} className="text-sm hover:text-brand-red">
                    {item.name}
                  </Link>
                  <p className="text-sm text-neutral-500">
                    {outOfStock
                      ? t["product.outOfStock"]
                      : item.price != null
                        ? `$${item.price.toFixed(2)}`
                        : t["product.priceOnRequest"]}
                  </p>
                </div>
                <button
                  disabled={item.price == null || outOfStock}
                  onClick={() =>
                    addItem({ productId: item.productId, variant: item.variant, name: item.name, price: item.price!, image: item.image })
                  }
                  className="border border-neutral-300 px-4 py-2 text-xs uppercase tracking-wide hover:border-brand-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t["product.addToCart"]}
                </button>
                <button onClick={() => remove(item.productId, item.variant)} className="text-sm text-neutral-500 hover:text-red-600">
                  {t["cart.remove"]}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
