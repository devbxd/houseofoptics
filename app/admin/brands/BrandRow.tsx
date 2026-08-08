"use client";

import { useState } from "react";
import { renameBrand, deleteBrand } from "./actions";

type Brand = { id: string; name: string; slug: string };

export function BrandRow({ brand, productCount }: { brand: Brand; productCount: number }) {
  const [name, setName] = useState(brand.name);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-300 px-2 py-1.5 text-sm sm:w-56"
          />
        ) : (
          <p className="truncate text-sm font-medium">{brand.name}</p>
        )}
        <p className="mt-0.5 text-xs text-neutral-500">
          {brand.slug} · {productCount} product{productCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm">
        {editing ? (
          <button
            className="text-brand-red"
            onClick={async () => {
              await renameBrand(brand.id, name);
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button className="text-neutral-600 hover:text-brand-black" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        <button
          disabled={deleting}
          className="text-neutral-600 hover:text-red-600 disabled:opacity-50"
          onClick={async () => {
            if (!confirm(`Delete "${brand.name}"? Associated products will remain but without a brand.`)) return;
            setDeleting(true);
            setError(null);
            try {
              await deleteBrand(brand.id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
            } finally {
              setDeleting(false);
            }
          }}
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 sm:basis-full">{error}</p>}
    </div>
  );
}
