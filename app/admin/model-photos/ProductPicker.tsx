"use client";

import { useMemo, useState } from "react";

export function ProductPicker({ products }: { products: { id: string; name: string }[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20);
  }, [products, query]);

  return (
    <div className="relative">
      <input type="hidden" name="product_id" value={selected?.id ?? ""} required />
      <input
        type="text"
        value={selected ? selected.name : query}
        onChange={(e) => {
          setSelected(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search a product by name..."
        className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-neutral-300 bg-white shadow-md">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={() => {
                  setSelected(p);
                  setQuery("");
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
