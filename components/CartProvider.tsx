"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartItem = {
  productId: string;
  variant: string | null;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, variant: string | null) => void;
  setQuantity: (productId: string, variant: string | null, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "house-of-optics-cart";

function sameLine(a: { productId: string; variant: string | null }, b: { productId: string; variant: string | null }) {
  return a.productId === b.productId && (a.variant ?? "") === (b.variant ?? "");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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

  // A cart persists indefinitely in localStorage — if the shop owner
  // deactivates or deletes a product after it was added, it would
  // otherwise sit there forever, still purchasable at checkout. Runs once
  // right after hydration and silently drops any line whose product isn't
  // (or no longer is) publicly readable — the public "products" RLS
  // policy already only allows is_active = true rows through.
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    const ids = Array.from(new Set(items.map((i) => i.productId)));
    const supabase = createClient();
    supabase
      .from("products")
      .select("id")
      .in("id", ids)
      .then(({ data }) => {
        const activeIds = new Set((data ?? []).map((r) => r.id));
        setItems((prev) => prev.filter((i) => activeIds.has(i.productId)));
      });
    // Only ever needs to run once per session, right after the cart is
    // first loaded from storage — not on every subsequent items change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) => (sameLine(i, item) ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variant: string | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variant })));
  }, []);

  const setQuantity = useCallback((productId: string, variant: string | null, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => !sameLine(i, { productId, variant }))
        : prev.map((i) => (sameLine(i, { productId, variant }) ? { ...i, quantity } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, count, subtotal }),
    [items, addItem, removeItem, setQuantity, clear, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
