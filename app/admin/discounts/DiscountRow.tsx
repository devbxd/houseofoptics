"use client";

import Image from "next/image";
import { useState } from "react";
import { updateDiscount } from "../produits/actions";

type Product = {
  id: string;
  name: string;
  price: number | null;
  discount_percent: number | null;
  image: string | null;
};

export function DiscountRow({ product }: { product: Product }) {
  const [value, setValue] = useState(product.discount_percent?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const percent = value.trim() ? Number(value) : null;
    await updateDiscount(product.id, percent);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const discounted =
    value.trim() && product.price != null ? Number(product.price) * (1 - Number(value) / 100) : null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 bg-white p-3 sm:flex-nowrap sm:gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-neutral-100">
        {product.image && <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />}
      </div>
      <div className="min-w-[10rem] flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-xs text-neutral-500">
          {product.price != null ? `$${Number(product.price).toFixed(2)}` : "No price set"}
          {discounted != null && <span className="ml-2 text-brand-red">→ ${discounted.toFixed(2)}</span>}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
        <input
          type="number"
          min={0}
          max={95}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="%"
          className="w-16 border border-neutral-300 px-2 py-1.5 text-center text-sm sm:w-20"
        />
        <button
          onClick={save}
          disabled={saving}
          className="bg-brand-black px-3 py-1.5 text-xs uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50 sm:px-4"
        >
          {saving ? "..." : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
