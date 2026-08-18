"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type WishlistItem = {
  productId: string;
  variant: string | null;
  slug: string;
  name: string;
  price: number | null;
  image: string | null;
  stock: number | null;
};

type WishlistContextValue = {
  items: WishlistItem[];
  has: (productId: string, variant: string | null) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string, variant: string | null) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "house-of-optics-wishlist";

// A product's different color/size variants are functionally different
// items to a shopper (different photo, sometimes different price/stock) —
// keyed the same way the cart already keys its own lines (see sameLine() in
// CartProvider.tsx), so wishlisting "Red — Large" and later "Blue — Small"
// of the same product saves both instead of the second silently replacing
// (or un-wishlisting) the first.
function sameLine(a: { productId: string; variant: string | null }, b: { productId: string; variant: string | null }) {
  return a.productId === b.productId && (a.variant ?? "") === (b.variant ?? "");
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const has = useCallback(
    (productId: string, variant: string | null) => items.some((i) => sameLine(i, { productId, variant })),
    [items]
  );

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const alreadyIn = prev.some((i) => sameLine(i, item));
      if (!alreadyIn) {
        // Fire-and-forget: lets the owner see what's being wishlisted most
        // without the wishlist itself needing an account or server round-trip.
        fetch("/api/track-wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId }),
          keepalive: true,
        }).catch(() => {});
      }
      return alreadyIn ? prev.filter((i) => !sameLine(i, item)) : [...prev, item];
    });
  }, []);

  const remove = useCallback((productId: string, variant: string | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variant })));
  }, []);

  const value = useMemo(
    () => ({ items, has, toggle, remove, count: items.length }),
    [items, has, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
