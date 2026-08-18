"use client";

import { useTransition } from "react";
import { deleteProduct } from "./actions";

export function ProductDeleteButton({ productId, productName }: { productId: string; productName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete "${productName}"? This also deletes its photos and variants — this can't be undone.`)) {
          startTransition(() => deleteProduct(productId));
        }
      }}
      className="text-neutral-600 hover:text-red-600 disabled:opacity-50"
    >
      {pending ? "..." : "Delete"}
    </button>
  );
}
