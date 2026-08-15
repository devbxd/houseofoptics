"use client";

import { useMemo, useState, useTransition } from "react";
import { addColorLink, removeColorLink } from "./actions";

type Member = { id: string; name: string };

export function ColorLinksEditor({
  productId,
  current,
  candidates,
}: {
  productId: string;
  current: Member[];
  candidates: { id: string; name: string }[]; // other active products, for search
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const currentIds = new Set(current.map((c) => c.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = candidates.filter((p) => p.id !== productId && !currentIds.has(p.id));
    if (!q) return pool.slice(0, 20);
    return pool.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 20);
  }, [candidates, query, productId, current]);

  return (
    <div>
      <div className="mb-3 space-y-1.5">
        {current.length === 0 && (
          <p className="text-xs text-neutral-500">
            No other colors linked yet — this product's page won't show a color picker.
          </p>
        )}
        {current.map((c) => (
          <div
            key={c.id}
            className="flex max-w-sm items-center justify-between border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <span className="truncate">{c.name}</span>
            <button
              type="button"
              onClick={() => startTransition(() => removeColorLink(productId, c.id))}
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
          placeholder="Search a product to tag as another color..."
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-neutral-300 bg-white shadow-md">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => {
                    startTransition(() => addColorLink(productId, p.id));
                    setQuery("");
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
    </div>
  );
}
