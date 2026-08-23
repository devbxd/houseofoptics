"use client";

import { useState } from "react";
import { addToNewDrop, removeFromNewDrop } from "./actions";
import { NEW_PRODUCT_DAYS } from "@/lib/products";

export function NewDropToggle({
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
  const [error, setError] = useState<string | null>(null);

  const ageMs = current ? Date.now() - new Date(current).getTime() : null;
  const active = ageMs != null && ageMs >= 0 && ageMs < NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000;
  const expiresAt = active ? new Date(new Date(current!).getTime() + NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-3">
        {active ? (
          <>
            <span className="text-sm text-emerald-700">
              In {categoryName} — until {expiresAt!.toLocaleDateString()}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                try {
                  await removeFromNewDrop(productId);
                  setCurrent(null);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Couldn't remove — try again.");
                } finally {
                  setPending(false);
                }
              }}
              className="text-sm text-neutral-600 hover:text-red-600 disabled:opacity-50"
            >
              {pending ? "..." : "Remove"}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const now = new Date().toISOString();
              try {
                await addToNewDrop(productId);
                setCurrent(now);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't add — try again.");
              } finally {
                setPending(false);
              }
            }}
            className="border border-brand-black px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white disabled:opacity-50"
          >
            {pending ? "Adding..." : `+ Add to ${categoryName}`}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
