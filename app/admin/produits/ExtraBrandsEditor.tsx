"use client";

import { useState } from "react";
import { addProductBrandLink, removeProductBrandLink } from "./actions";

type Link = { linkId: string; brandId: string; brandName: string };

export function ExtraBrandsEditor({
  productId,
  allBrands,
  current,
}: {
  productId: string;
  allBrands: { id: string; name: string }[];
  current: Link[];
}) {
  const [links, setLinks] = useState(current);
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = allBrands.filter((b) => !links.some((l) => l.brandId === b.id));

  return (
    <div>
      <label className="mb-1 block text-sm text-neutral-600">Also show under these brands</label>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={available.length === 0}
          className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-50"
        >
          <option value="">{available.length === 0 ? "No more brands" : "Choose a brand…"}</option>
          {available.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected || pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            try {
              const brand = allBrands.find((b) => b.id === selected)!;
              const link = await addProductBrandLink(productId, selected);
              setLinks((prev) => [...prev, { linkId: link.id, brandId: brand.id, brandName: brand.name }]);
              setSelected("");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Couldn't add — try again.");
            } finally {
              setPending(false);
            }
          }}
          className="shrink-0 border border-brand-black px-3 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white disabled:opacity-50"
        >
          {pending ? "..." : "Add"}
        </button>
      </div>

      {links.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {links.map((l) => (
            <li
              key={l.linkId}
              className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 py-1 pl-2.5 pr-1 text-xs"
            >
              <span>{l.brandName}</span>
              <button
                type="button"
                disabled={removingId === l.linkId}
                onClick={async () => {
                  setRemovingId(l.linkId);
                  setError(null);
                  try {
                    await removeProductBrandLink(l.linkId, productId);
                    setLinks((prev) => prev.filter((x) => x.linkId !== l.linkId));
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Couldn't remove — try again.");
                  } finally {
                    setRemovingId(null);
                  }
                }}
                className="px-1.5 py-1 text-neutral-500 hover:text-red-600 disabled:opacity-50"
              >
                {removingId === l.linkId ? "…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
