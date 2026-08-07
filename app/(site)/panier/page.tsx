"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { useLocale } from "@/lib/locale-client";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal } = useCart();
  const { t } = useLocale();

  if (items.length === 0) {
    return (
      <main className="bg-brand-beige px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-serif text-2xl">{t["cart.empty"]}</h1>
          <Link href="/produits" className="mt-6 inline-block border border-brand-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-brand-black hover:text-white">
            {t["cart.viewCollection"]}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-beige px-4 py-12">
      <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 font-serif text-2xl">{t["cart.title"]}</h1>

      <div className="divide-y divide-neutral-200 border-y border-neutral-200">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variant ?? ""}`} className="flex items-center gap-4 py-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-neutral-100">
              {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="text-sm">{item.name}</p>
              <p className="text-sm text-neutral-500">${item.price.toFixed(2)}</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => setQuantity(item.productId, item.variant, Number(e.target.value))}
              className="w-16 border border-neutral-300 px-2 py-1 text-center text-sm"
            />
            <button onClick={() => removeItem(item.productId, item.variant)} className="text-sm text-neutral-500 hover:text-red-600">
              {t["cart.remove"]}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-neutral-500">{t["cart.subtotal"]}</p>
        <p className="text-lg">${subtotal.toFixed(2)}</p>
      </div>

      <Link
        href="/checkout"
        className="mt-8 block w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90"
      >
        {t["cart.checkout"]}
      </Link>
      </div>
    </main>
  );
}
