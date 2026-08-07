"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

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
  price: number;
  image: string | null;
  stock: number | null;
  variants: Variant[];
  t: Record<string, string>;
}) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string | null>(variants[0]?.label ?? null);
  const [added, setAdded] = useState(false);

  const activeStock = variants.length > 0 ? variants.find((v) => v.label === selected)?.stock ?? null : stock;
  const outOfStock = activeStock != null && activeStock <= 0;
  const needsSelection = variants.length > 0 && !selected;

  function handleAdd() {
    addItem({ productId, variant: selected, name: selected ? `${name} — ${selected}` : name, price, image });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div>
      {variants.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-neutral-600">Color</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setSelected(v.label)}
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

      {activeStock != null && activeStock > 0 && activeStock <= 5 && (
        <p className="mt-3 text-sm font-medium text-brand-red">Only {activeStock} left — order soon</p>
      )}
      {outOfStock && <p className="mt-3 text-sm font-medium text-neutral-500">Out of stock</p>}

      <button
        onClick={handleAdd}
        disabled={needsSelection || outOfStock}
        className="mt-4 block w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {added ? t["product.added"] : outOfStock ? "Out of stock" : t["product.addToCart"]}
      </button>
    </div>
  );
}
