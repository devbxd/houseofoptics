"use client";

import { useState } from "react";
import { renameCategory, deleteCategory, setCategoryPosition } from "./actions";

type Category = { id: string; name: string; slug: string };

export function CategoryRow({
  category,
  productCount,
  position,
  siblingCount,
}: {
  category: Category;
  productCount: number;
  position: number;
  siblingCount: number;
}) {
  const [name, setName] = useState(category.name);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 border-b border-neutral-100 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {siblingCount > 1 && (
          <select
            aria-label="Position"
            value={position}
            disabled={moving}
            onChange={async (e) => {
              setMoving(true);
              try {
                await setCategoryPosition(category.id, Number(e.target.value));
              } finally {
                setMoving(false);
              }
            }}
            className="shrink-0 border border-neutral-300 px-1.5 py-1 text-sm disabled:opacity-50"
          >
            {Array.from({ length: siblingCount }, (_, i) => (
              <option key={i} value={i}>
                {i + 1}
              </option>
            ))}
          </select>
        )}

        <div className="min-w-0">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 px-2 py-1.5 text-sm sm:w-56"
            />
          ) : (
            <p className="truncate text-sm font-medium">{category.name}</p>
          )}
          <p className="mt-0.5 text-xs text-neutral-500">
            {category.slug} · {productCount} product{productCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm">
        {editing ? (
          <button
            className="text-brand-red"
            onClick={async () => {
              await renameCategory(category.id, name);
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
            if (!confirm(`Delete "${category.name}"? Associated products will remain but without a category.`)) return;
            setDeleting(true);
            setError(null);
            try {
              await deleteCategory(category.id);
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
