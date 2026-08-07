"use client";

import { useState } from "react";
import { renameCategory, deleteCategory } from "./actions";

type Category = { id: string; name: string; slug: string };

export function CategoryRow({ category, productCount }: { category: Category; productCount: number }) {
  const [name, setName] = useState(category.name);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-neutral-100">
      <td className="py-3 pr-4">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-neutral-300 px-2 py-1 text-sm"
          />
        ) : (
          <span>{category.name}</span>
        )}
      </td>
      <td className="py-3 pr-4 text-sm text-neutral-500">{category.slug}</td>
      <td className="py-3 pr-4 text-sm text-neutral-500">{productCount}</td>
      <td className="space-x-3 py-3 text-right text-sm">
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
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}
