"use client";

import { useState, useTransition } from "react";
import { toggleSoldOut } from "./actions";

export function SoldOutButton({ productId, initialSoldOut }: { productId: string; initialSoldOut: boolean }) {
  const [soldOut, setSoldOut] = useState(initialSoldOut);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !soldOut;
        setSoldOut(next);
        startTransition(async () => {
          try {
            await toggleSoldOut(productId);
          } catch {
            setSoldOut(!next);
          }
        });
      }}
      className={`border px-4 py-2 text-xs uppercase tracking-wide disabled:opacity-50 ${
        soldOut ? "border-brand-red bg-brand-red text-white" : "border-neutral-300 text-neutral-600 hover:border-brand-black"
      }`}
    >
      {pending ? "..." : soldOut ? "Sold out — click to make available" : "Mark as sold out"}
    </button>
  );
}
