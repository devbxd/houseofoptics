// "Buy Now" checks out a single item without touching the shared cart —
// stored in sessionStorage (not the cart's localStorage key) so it never
// merges with or clears whatever the customer already has in their cart.
const KEY = "house-of-optics-buy-now";

export type BuyNowItem = {
  productId: string;
  variant: string | null;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

export function setBuyNowItem(item: BuyNowItem) {
  sessionStorage.setItem(KEY, JSON.stringify(item));
}

export function getBuyNowItem(): BuyNowItem | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBuyNowItem() {
  sessionStorage.removeItem(KEY);
}
