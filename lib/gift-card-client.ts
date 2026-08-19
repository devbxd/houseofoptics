// The gift card is "claimed" for real (redeemed_at set, atomically) only at
// checkout — see createOrder in app/(site)/checkout/actions.ts — same as
// the spin-wheel promo code. This just remembers which code the customer
// picked on the /carte-cadeau reveal page so checkout can pick it back up,
// exactly like lib/buy-now.ts remembers a Buy Now item.
const KEY = "house-of-optics-active-gift-card";

export type ActiveGiftCard = {
  code: string;
  type: "product" | "discount" | "credit";
};

export function setActiveGiftCard(gc: ActiveGiftCard) {
  localStorage.setItem(KEY, JSON.stringify(gc));
}

export function getActiveGiftCard(): ActiveGiftCard | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveGiftCard() {
  localStorage.removeItem(KEY);
}
