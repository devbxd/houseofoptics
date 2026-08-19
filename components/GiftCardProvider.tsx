"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// The gift card is "claimed" for real (redeemed_at set, atomically) only at
// checkout — see createOrder in app/(site)/checkout/actions.ts — same as
// the spin-wheel promo code. This just remembers which code the customer
// picked on the /carte-cadeau reveal page, the same way CartProvider
// remembers cart lines — as a context (not a plain localStorage helper) so
// every mounted component reacts the instant it changes, e.g. the
// site-wide reminder pill appearing right after the code is revealed
// without needing a page reload.
export type ActiveGiftCard = { code: string; type: "product" | "discount" | "credit" };

type GiftCardContextValue = {
  giftCard: ActiveGiftCard | null;
  setGiftCard: (gc: ActiveGiftCard) => void;
  clearGiftCard: () => void;
};

const GiftCardContext = createContext<GiftCardContextValue | null>(null);
const STORAGE_KEY = "house-of-optics-active-gift-card";

export function GiftCardProvider({ children }: { children: React.ReactNode }) {
  const [giftCard, setGiftCardState] = useState<ActiveGiftCard | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setGiftCardState(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
  }, []);

  const setGiftCard = useCallback((gc: ActiveGiftCard) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gc));
    setGiftCardState(gc);
  }, []);

  const clearGiftCard = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGiftCardState(null);
  }, []);

  const value = useMemo(() => ({ giftCard, setGiftCard, clearGiftCard }), [giftCard, setGiftCard, clearGiftCard]);

  return <GiftCardContext.Provider value={value}>{children}</GiftCardContext.Provider>;
}

export function useGiftCard() {
  const ctx = useContext(GiftCardContext);
  if (!ctx) throw new Error("useGiftCard must be used within GiftCardProvider");
  return ctx;
}
