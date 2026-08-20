"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCustomerAuth } from "./CustomerAuthProvider";
import { claimGiftCard, releaseGiftCard, getMyActiveGiftCard, type GiftCardPreview } from "@/app/(site)/carte-cadeau/actions";

// Which unredeemed gift card (if any) the logged-in customer currently
// holds — tied to their account (gift_cards.customer_id) instead of one
// browser's local storage, so it follows them if they switch phones. Gift
// cards require an account to redeem at all (see middleware.ts on
// /carte-cadeau), so there's nothing to track for a signed-out visitor.
type GiftCardContextValue = {
  giftCard: GiftCardPreview | null;
  claim: (code: string) => Promise<GiftCardPreview>;
  clearGiftCard: () => Promise<void>;
  refreshGiftCard: () => Promise<void>;
};

const GiftCardContext = createContext<GiftCardContextValue | null>(null);

export function GiftCardProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useCustomerAuth();
  const [giftCard, setGiftCardState] = useState<GiftCardPreview | null>(null);

  const refreshGiftCard = useCallback(async () => {
    if (!user) {
      setGiftCardState(null);
      return;
    }
    const result = await getMyActiveGiftCard();
    setGiftCardState(result.valid ? result : null);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshGiftCard();
  }, [authLoading, refreshGiftCard]);

  const claim = useCallback(async (code: string) => {
    const result = await claimGiftCard(code);
    setGiftCardState(result.valid ? result : null);
    return result;
  }, []);

  const clearGiftCard = useCallback(async () => {
    if (giftCard && giftCard.valid) {
      await releaseGiftCard(giftCard.code);
    }
    setGiftCardState(null);
  }, [giftCard]);

  const value = useMemo(
    () => ({ giftCard, claim, clearGiftCard, refreshGiftCard }),
    [giftCard, claim, clearGiftCard, refreshGiftCard]
  );

  return <GiftCardContext.Provider value={value}>{children}</GiftCardContext.Provider>;
}

export function useGiftCard() {
  const ctx = useContext(GiftCardContext);
  if (!ctx) throw new Error("useGiftCard must be used within GiftCardProvider");
  return ctx;
}
