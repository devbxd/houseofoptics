"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  price: number | null;
  image: string | null;
};

type WishlistContextValue = {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "house-of-optics-wishlist";

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

  const has = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const alreadyIn = prev.some((i) => i.productId === item.productId);
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
      return alreadyIn ? prev.filter((i) => i.productId !== item.productId) : [...prev, item];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
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
