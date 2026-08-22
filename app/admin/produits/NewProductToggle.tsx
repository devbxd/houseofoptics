"use client";

import { useState } from "react";
import { addToNewProductCategory, removeFromNewProductCategory } from "./actions";
import { NEW_PRODUCT_DAYS } from "@/lib/products";

export function NewProductToggle({
  productId,
  categoryName,
  addedAt,
}: {
  productId: string;
  categoryName: string;
  addedAt: string | null;
}) {
  const [current, setCurrent] = useState(addedAt);
  const [pending, setPending] = useState(false);

  const ageMs = current ? Date.now() - new Date(current).getTime() : null;
  const active = ageMs != null && ageMs >= 0 && ageMs < NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
  const expiresAt = active ? new Date(new Date(current!).getTime() + NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000) : null;

  return (
    <div className="mt-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
      <p className="mb-1 text-sm font-medium">{categoryName}</p>
      <p className="mb-3 text-xs text-neutral-500">
        Adds this product to the "{categoryName}" category for {NEW_PRODUCT_DAYS} days — it stays in its real
        category and brand too, and drops out of "{categoryName}" on its own once the {NEW_PRODUCT_DAYS} days are
        up.
      </p>
      {active ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-700">Active — until {expiresAt!.toLocaleDateString()}</span>
          <button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await removeFromNewProductCategory(productId);
                setCurrent(null);
              } finally {
                setPending(false);
              }
            }}
            className="text-sm text-neutral-600 hover:text-red-600 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              const now = new Date().toISOString();
              await addToNewProductCategory(productId);
              setCurrent(now);
            } finally {
              setPending(false);
            }
          }}
          className="border border-brand-black px-4 py-2 text-sm uppercase tracking-wide hover:bg-brand-black hover:text-white disabled:opacity-50"
        >
          Add to {categoryName}
        </button>
      )}
    </div>
  );
}
