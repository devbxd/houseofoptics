"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartFab() {
  const { count } = useCart();
  if (count === 0) return null;

  return (
    <Link
      href="/panier"
      className="fixed bottom-[5.25rem] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-black text-white shadow-xl transition-transform hover:scale-105"
      aria-label="Voir le panier"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
        <circle cx="9" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.5 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-[11px] font-medium">
        {count}
      </span>
    </Link>
  );
}
