"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCustomerAuth } from "./CustomerAuthProvider";

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

// A product's different color/size variants are functionally different
// items to a shopper (different photo, sometimes different price/stock) —
// keyed the same way the cart already keys its own lines (see sameLine() in
// CartProvider.tsx), so wishlisting "Red — Large" and later "Blue — Small"
// of the same product saves both instead of the second silently replacing
// (or un-wishlisting) the first.
function sameLine(a: { productId: string; variant: string | null }, b: { productId: string; variant: string | null }) {
  return a.productId === b.productId && (a.variant ?? "") === (b.variant ?? "");
}

// The wishlist now lives entirely in the customer's account (wishlist_items,
// RLS-scoped to their own rows) instead of localStorage — it needs an
// account so it follows the customer across phones/devices instead of
// disappearing the moment they clear their browser or switch phones.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("wishlist_items")
      // The inner join filters through the public "products" RLS policy
      // (is_active = true) — a product the shop owner deactivated or
      // deleted since it was wishlisted just silently drops out of the
      // result here, no separate cleanup query needed.
      .select("product_id, variant, slug, name, price, image, stock, products!inner(is_active)")
      .eq("customer_id", user.id)
      .then(({ data }) => {
        setItems(
          (data ?? []).map((row) => ({
            productId: row.product_id,
            variant: row.variant || null,
            slug: row.slug,
            name: row.name,
            price: row.price,
            image: row.image,
            stock: row.stock,
          }))
        );
      });
  }, [user, authLoading]);

  const has = useCallback(
    (productId: string, variant: string | null) => items.some((i) => sameLine(i, { productId, variant })),
    [items]
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      if (!user) {
        router.push(`/compte/connexion?next=${encodeURIComponent(pathname || "/wishlist")}`);
        return;
      }
      const supabase = createClient();
      const alreadyIn = items.some((i) => sameLine(i, item));

      if (alreadyIn) {
        setItems((prev) => prev.filter((i) => !sameLine(i, item)));
        supabase
          .from("wishlist_items")
          .delete()
          .eq("customer_id", user.id)
          .eq("product_id", item.productId)
          .eq("variant", item.variant ?? "")
          .then(() => {});
      } else {
        setItems((prev) => [...prev, item]);
        supabase
          .from("wishlist_items")
          .insert({
            customer_id: user.id,
            product_id: item.productId,
            variant: item.variant ?? "",
            slug: item.slug,
            name: item.name,
            price: item.price,
            image: item.image,
            stock: item.stock,
          })
          .then(() => {});
        // Fire-and-forget: lets the owner see what's being wishlisted most
        // without blocking on it.
        fetch("/api/track-wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: item.productId }),
          keepalive: true,
        }).catch(() => {});
      }
    },
    [items, user, router, pathname]
  );

  const remove = useCallback(
    (productId: string, variant: string | null) => {
      if (!user) return;
      setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variant })));
      const supabase = createClient();
      supabase
        .from("wishlist_items")
        .delete()
        .eq("customer_id", user.id)
        .eq("product_id", productId)
        .eq("variant", variant ?? "")
        .then(() => {});
    },
    [user]
  );

  const value = useMemo(() => ({ items, has, toggle, remove, count: items.length }), [items, has, toggle, remove]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
