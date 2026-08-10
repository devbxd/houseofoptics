"use client";

import { useMemo, useState, useTransition } from "react";
import { addRelatedProduct, removeRelatedProduct } from "./actions";

type Pick = { rowId: string; productId: string; name: string };

export function RelatedProductsEditor({
  productId,
  current,
  candidates,
}: {
  productId: string;
  current: Pick[];
  candidates: { id: string; name: string }[]; // other active products, for search
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const currentProductIds = new Set(current.map((c) => c.productId));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = candidates.filter((p) => p.id !== productId);
    if (!q) return pool.slice(0, 20);
    return pool.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20);
  }, [candidates, query, productId]);

  return (
    <div>
      <div className="mb-3 space-y-1.5">
        {current.length === 0 && (
          <p className="text-xs text-neutral-500">
            No manual picks yet — the public page falls back to automatic same category/brand matches.
          </p>
        )}
        {current.map((c) => (
          <div
            key={c.rowId}
            className="flex max-w-sm items-center justify-between border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <span className="truncate">{c.name}</span>
            <button
              type="button"
              onClick={() => startTransition(() => removeRelatedProduct(c.rowId, productId))}
              className="ml-3 shrink-0 text-xs text-neutral-400 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search a product to add..."
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-neutral-300 bg-white shadow-md">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={currentProductIds.has(p.id)}
                  onMouseDown={() => {
                    startTransition(() => addRelatedProduct(productId, p.id));
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {p.name}
                  {currentProductIds.has(p.id) && <span className="text-xs text-neutral-400">Added</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
