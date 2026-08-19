"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

export type GiftableProduct = {
  id: string;
  name: string;
  price: number | null;
  images: { url: string }[];
};

// A small visual browse-and-pick grid, deliberately styled like the public
// catalog (image, name, price) rather than a plain text dropdown — the boss
// asked for "comme la page produit" when choosing what to gift.
export function ProductGiftPicker({
  products,
  selectedId,
  onSelect,
}: {
  products: GiftableProduct[];
  selectedId: string | null;
  onSelect: (product: GiftableProduct) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a product by name..."
        className="mb-3 w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
      />
      <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto rounded-md border border-neutral-200 p-2 sm:grid-cols-4">
        {filtered.length === 0 && <p className="col-span-full py-6 text-center text-xs text-neutral-400">No products found.</p>}
        {filtered.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={`overflow-hidden rounded-md border text-left transition-colors ${
                active ? "border-brand-black ring-1 ring-brand-black" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="relative aspect-square w-full bg-neutral-100">
                {p.images[0] && <Image src={p.images[0].url} alt={p.name} fill unoptimized sizes="120px" className="object-cover" />}
                {active && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-black text-white">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                      <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="p-1.5">
                <p className="truncate text-[11px] leading-tight">{p.name}</p>
                <p className="text-[10px] text-neutral-500">{p.price != null ? `$${p.price.toFixed(2)}` : "—"}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
