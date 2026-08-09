"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { setBuyNowItem } from "@/lib/buy-now";

type Variant = { label: string; stock: number | null };

export function ProductActions({
  productId,
  name,
  price,
  image,
  stock,
  variants,
  t,
}: {
  productId: string;
  name: string;
  price: number | null;
  image: string | null;
  stock: number | null;
  variants: Variant[];
  t: Record<string, string>;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  // Color is optional — nothing pre-selected, and tapping a color again
  // deselects it so the base item can still be ordered without one.
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const activeStock = selected ? variants.find((v) => v.label === selected)?.stock ?? null : stock;
  const outOfStock = activeStock != null && activeStock <= 0;
  const noPrice = price == null;

  function handleAdd() {
    if (price == null) return;
    addItem({ productId, variant: selected, name: selected ? `${name} — ${selected}` : name, price, image }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleBuyNow() {
    if (price == null || outOfStock) return;
    setBuyNowItem({
      productId,
      variant: selected,
      name: selected ? `${name} — ${selected}` : name,
      price,
      image,
      quantity,
    });
    router.push("/checkout?buyNow=1");
  }

  const label = added
    ? t["product.added"]
    : noPrice
      ? t["product.priceOnRequest"]
      : outOfStock
        ? t["product.outOfStock"]
        : t["product.addToCart"];

  return (
    <div>
      {variants.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-neutral-600">{t["product.colorOptional"]}</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setSelected((sel) => (sel === v.label ? null : v.label))}
                disabled={v.stock != null && v.stock <= 0}
                className={`border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  selected === v.label ? "border-brand-black bg-brand-black text-white" : "border-neutral-300 hover:border-brand-black"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!noPrice && activeStock != null && activeStock > 0 && activeStock <= 5 && (
        <p className="mt-3 text-sm font-medium text-brand-red">
          {t["product.onlyLeft"].replace("{count}", String(activeStock))}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <div className="flex items-center border border-neutral-300">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-12 w-10 items-center justify-center text-lg text-neutral-600 hover:text-brand-black"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-12 w-10 items-center justify-center text-lg text-neutral-600 hover:text-brand-black"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={outOfStock || noPrice}
          className="flex-1 bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:opacity-100"
        >
          {label}
        </button>
      </div>

      {!noPrice && (
        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="mt-3 block w-full border border-brand-black py-3 text-center text-sm uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-black hover:text-white disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300"
        >
          {t["product.buyNow"]}
        </button>
      )}
    </div>
  );
}
