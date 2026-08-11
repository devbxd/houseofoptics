// No customer accounts on this site — order history is tracked per
// device/browser instead, same trust model as the cart and wishlist.
const KEY = "house-of-optics-order-history";

export function addOrderToHistory(orderId: string) {
  try {
    const ids = getOrderHistoryIds();
    if (ids.includes(orderId)) return;
    localStorage.setItem(KEY, JSON.stringify([orderId, ...ids].slice(0, 100)));
  } catch {
    // localStorage unavailable (private browsing, etc.) — order still
    // succeeded, it just won't show up in the local history list.
  }
}

export function getOrderHistoryIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
