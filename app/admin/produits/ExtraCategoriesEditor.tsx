"use client";

import { useState } from "react";
import { addProductCategoryLink, removeProductCategoryLink } from "./actions";
import { NEW_DROP_CATEGORY_SLUG, NEW_PRODUCT_DAYS } from "@/lib/products";

type Link = { linkId: string; categoryId: string; categoryName: string; categorySlug: string; addedAt: string };

export function ExtraCategoriesEditor({
  productId,
  allCategories,
  current,
}: {
  // Omitted on the "create product" form, where the product doesn't have an
  // id yet — picks there are staged as hidden `extra_category_id` fields
  // (read by createProduct in actions.ts) and only actually linked once the
  // product is saved, instead of hitting the live add/remove actions below.
  productId?: string;
  allCategories: { id: string; name: string; slug: string }[];
  current: Link[];
}) {
  const [links, setLinks] = useState(current);
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = allCategories.filter((c) => !links.some((l) => l.categoryId === c.id));

  return (
    <div>
      <label className="mb-1 block text-sm text-neutral-600">Also show in these categories</label>
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={available.length === 0}
          className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none disabled:opacity-50"
        >
          <option value="">{available.length === 0 ? "No more categories" : "Choose a category…"}</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected || pending}
          onClick={async () => {
            const cat = allCategories.find((c) => c.id === selected)!;

            if (!productId) {
              // Staged: no product to link to yet, just remember the pick
              // locally — createProduct reads it from the hidden inputs
              // below once the form is actually submitted.
              setLinks((prev) => [
                ...prev,
                { linkId: cat.id, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug, addedAt: new Date().toISOString() },
              ]);
              setSelected("");
              return;
            }

            setPending(true);
            setError(null);
            try {
              const link = await addProductCategoryLink(productId, selected);
              setLinks((prev) => [
                ...prev,
                { linkId: link.id, categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug, addedAt: link.added_at },
              ]);
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
          {links.map((l) => {
            const expiresAt =
              l.categorySlug === NEW_DROP_CATEGORY_SLUG
                ? new Date(new Date(l.addedAt).getTime() + NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000)
                : null;
            return (
              <li
                key={l.linkId}
                className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 py-1 pl-2.5 pr-1 text-xs"
              >
                {!productId && <input type="hidden" name="extra_category_id" value={l.categoryId} />}
                <span>
                  {l.categoryName}
                  {expiresAt && <span className="text-neutral-400"> · until {expiresAt.toLocaleDateString()}</span>}
                </span>
                <button
                  type="button"
                  disabled={removingId === l.linkId}
                  onClick={async () => {
                    if (!productId) {
                      setLinks((prev) => prev.filter((x) => x.linkId !== l.linkId));
                      return;
                    }
                    setRemovingId(l.linkId);
                    setError(null);
                    try {
                      await removeProductCategoryLink(l.linkId, productId);
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
            );
          })}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
