"use client";

import { useState } from "react";
import { setNewProductCategory } from "./actions";

export function NewProductCategoryPicker({
  categories,
  currentId,
}: {
  categories: { id: string; name: string }[];
  currentId: string | null;
}) {
  const [value, setValue] = useState(currentId ?? "");
  const [pending, setPending] = useState(false);

  return (
    <div className="mb-8 max-w-md rounded-md border border-neutral-200 bg-white p-4">
      <p className="mb-1 text-sm font-medium">"New Product" category</p>
      <p className="mb-3 text-xs text-neutral-500">
        Pick which existing category is the auto-expiring "New Product" bucket. From a product's edit page, a
        button links it here — it stays for 15 days, then drops out on its own, without touching that product's
        real category or brand.
      </p>
      <select
        value={value}
        disabled={pending}
        onChange={async (e) => {
          const next = e.target.value || null;
          setPending(true);
          setValue(next ?? "");
          try {
            await setNewProductCategory(next);
          } finally {
            setPending(false);
          }
        }}
        className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-50"
      >
        <option value="">None — feature off</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
